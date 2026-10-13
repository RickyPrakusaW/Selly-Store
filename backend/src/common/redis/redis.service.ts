import { Injectable, OnModuleDestroy } from '@nestjs/common';
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

  async isConnected(): Promise<boolean> {
    try {
      if (this.client.status === 'wait') await this.client.connect();
      if (this.client.status !== 'ready') await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }

  async setWithTtl(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<void> {
    if (!(await this.isConnected())) {
      return;
    }
    await this.client.set(key, value, 'EX', Math.max(1, ttlSeconds));
  }

  async exists(key: string): Promise<boolean> {
    if (!(await this.isConnected())) {
      return false;
    }
    return (await this.client.exists(key)) === 1;
  }

  async delete(key: string): Promise<void> {
    if (!(await this.isConnected())) return;
    await this.client.del(key);
  }

  async enqueue(key: string, value: string): Promise<boolean> {
    if (!(await this.isConnected())) return false;
    await this.client.lpush(key, value);
    return true;
  }

  async claim(queue: string, processing: string): Promise<string | null> {
    if (!(await this.isConnected())) return null;
    return this.client.rpoplpush(queue, processing);
  }

  async acknowledge(processing: string, value: string): Promise<void> {
    if (!(await this.isConnected())) return;
    await this.client.lrem(processing, 1, value);
  }

  onModuleDestroy(): void {
    if (this.client.status !== 'end') this.client.disconnect();
  }
}
