import {
  Injectable,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(config: ConfigService) {
    this.client = new Redis({
      host: config.get<string>('REDIS_HOST', '127.0.0.1'),
      port: config.get<number>('REDIS_PORT', 6379),
      password: config.get<string>('REDIS_PASSWORD'),
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });
    this.client.on('error', () => undefined);
  }

  private async ready(): Promise<void> {
    try {
      if (this.client.status === 'wait') await this.client.connect();
      if (this.client.status !== 'ready') await this.client.ping();
    } catch {
      throw new ServiceUnavailableException(
        'Token revocation service is unavailable',
      );
    }
  }

  async setWithTtl(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<void> {
    await this.ready();
    await this.client.set(key, value, 'EX', Math.max(1, ttlSeconds));
  }

  async exists(key: string): Promise<boolean> {
    await this.ready();
    return (await this.client.exists(key)) === 1;
  }

  onModuleDestroy(): void {
    if (this.client.status !== 'end') this.client.disconnect();
  }
}
