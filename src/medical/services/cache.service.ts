import { Inject, Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../constants';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis
  ) {
    this.logger.debug('Initializing CacheService');
  }

  async get(key: string): Promise<string | null> {
    this.logger.debug(`Getting cache key: ${key}`);
    return this.redis.get(key);
  }

  async set(key: string, value: string, expireSeconds?: number): Promise<void> {
    this.logger.debug(`Setting cache key: ${key}, expires in: ${expireSeconds}s`);
    if (expireSeconds) {
      await this.redis.set(key, value, 'EX', expireSeconds);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
} 