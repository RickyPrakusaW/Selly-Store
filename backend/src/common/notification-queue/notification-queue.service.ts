import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MailService } from '../mail/mail.service';
import { RedisService } from '../redis/redis.service';
import { WaService } from '../wa/wa.service';

type NotificationRequest =
  | {
      kind: 'mail';
      to: string;
      subject: string;
      text: string;
      html?: string;
      idempotencyKey: string;
    }
  | {
      kind: 'verification_email';
      to: string;
      token: string;
      idempotencyKey: string;
    }
  | {
      kind: 'whatsapp';
      target: string;
      message: string;
      idempotencyKey: string;
    };

type NotificationJob = NotificationRequest & {
  id: string;
  attempt: number;
  queuedAt: string;
};

const QUEUE = 'queue:notifications';
const PROCESSING = 'queue:notifications:processing';
const DEAD_LETTER = 'queue:notifications:dead';
const MAX_ATTEMPTS = 5;

@Injectable()
export class NotificationQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationQueueService.name);
  private readonly localQueue: NotificationJob[] = [];
  private worker?: NodeJS.Timeout;
  private working = false;

  constructor(
    private readonly redis: RedisService,
    private readonly mail: MailService,
    private readonly wa: WaService,
  ) {}

  onModuleInit(): void {
    this.worker = setInterval(() => void this.work(), 250);
    this.worker.unref();
  }

  onModuleDestroy(): void {
    if (this.worker) clearInterval(this.worker);
  }

  async enqueue(request: NotificationRequest): Promise<void> {
    const job: NotificationJob = {
      ...request,
      id: randomUUID(),
      attempt: 0,
      queuedAt: new Date().toISOString(),
    };
    if (!(await this.redis.enqueue(QUEUE, JSON.stringify(job)))) {
      this.localQueue.push(job);
      this.logger.warn('Redis unavailable; notification queued in memory');
    }
  }

  private async work(): Promise<void> {
    if (this.working) return;
    this.working = true;
    let serialized: string | null = null;
    try {
      serialized = await this.redis.claim(QUEUE, PROCESSING);
      const job = serialized
        ? (JSON.parse(serialized) as NotificationJob)
        : this.localQueue.shift();
      if (!job) return;
      const processedKey = `notification:processed:${job.idempotencyKey}`;
      if (!(await this.redis.exists(processedKey))) {
        await this.dispatch(job);
        await this.redis.setWithTtl(processedKey, '1', 30 * 24 * 60 * 60);
      }
      if (serialized) await this.redis.acknowledge(PROCESSING, serialized);
    } catch (error) {
      this.logger.error(
        `Notification dispatch failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      if (serialized) {
        await this.redis.acknowledge(PROCESSING, serialized);
        const job = JSON.parse(serialized) as NotificationJob;
        job.attempt += 1;
        const destination = job.attempt >= MAX_ATTEMPTS ? DEAD_LETTER : QUEUE;
        const delayMs = Math.min(30_000, 500 * 2 ** job.attempt);
        setTimeout(
          () => void this.redis.enqueue(destination, JSON.stringify(job)),
          delayMs,
        ).unref();
      }
    } finally {
      this.working = false;
    }
  }

  private async dispatch(job: NotificationJob): Promise<void> {
    if (job.kind === 'verification_email') {
      await this.mail.sendVerification(job.to, job.token);
      return;
    }
    if (job.kind === 'mail') {
      await this.mail.send(job.to, job.subject, job.text, job.html);
      return;
    }
    const sent = await this.wa.send(job.target, job.message);
    if (!sent) throw new Error('WhatsApp provider rejected the message');
  }
}
