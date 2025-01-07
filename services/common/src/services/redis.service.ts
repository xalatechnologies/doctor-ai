import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { LoggerService } from './logger.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly redis: Redis;
  private readonly defaultTTL: number = 3600; // 1 hour in seconds

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService
  ) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB', 0),
      retryStrategy: (times: number) => {
        if (times > 3) {
          this.logger.error('Redis connection failed after 3 retries', { service: 'RedisService' });
          return null;
        }
        return Math.min(times * 100, 3000);
      }
    });
  }

  async onModuleInit() {
    try {
      await this.redis.ping();
      this.logger.info('Redis connection established', { service: 'RedisService' });
    } catch (error) {
      this.logger.error('Failed to connect to Redis', { error, service: 'RedisService' });
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.redis.quit();
    this.logger.info('Redis connection closed', { service: 'RedisService' });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      this.logger.error(`Error retrieving key ${key} from cache`, { error, service: 'RedisService' });
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (error) {
      this.logger.error(`Error setting key ${key} in cache`, { error, service: 'RedisService' });
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key ${key} from cache`, { error, service: 'RedisService' });
    }
  }

  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    try {
      const cachedData = await this.get<T>(key);
      if (cachedData) {
        return cachedData;
      }

      const freshData = await fetchFn();
      await this.set(key, freshData, ttl);
      return freshData;
    } catch (error) {
      this.logger.error(`Error in getOrSet for key ${key}`, { error, service: 'RedisService' });
      throw error;
    }
  }

  generateKey(...parts: (string | number)[]): string {
    return parts.map(part => String(part)).join(':');
  }

  async clearPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      this.logger.error(`Error clearing pattern ${pattern} from cache`, { error, service: 'RedisService' });
    }
  }

  getClient(): Redis {
    return this.redis;
  }
} 