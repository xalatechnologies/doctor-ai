import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  ttl?: number;
}

@Injectable()
export class CacheService implements OnModuleInit {
  private readonly logger = new Logger(CacheService.name);
  private client: Redis;
  private readonly defaultTTL: number;

  constructor(private readonly configService: ConfigService) {
    this.defaultTTL = this.configService.get('CACHE_TTL') || 3600; // 1 hour default
  }

  async onModuleInit() {
    try {
      await this.initializeClient();
      await this.validateConnection();
      this.logger.log('Cache connection established successfully');
    } catch (error) {
      this.logger.error('Failed to initialize cache connection:', error);
      throw error;
    }
  }

  private async initializeClient(): Promise<void> {
    const config: CacheConfig = {
      host: this.configService.get('REDIS_HOST') || 'localhost',
      port: this.configService.get('REDIS_PORT') || 6379,
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB') || 0,
      keyPrefix: this.configService.get('REDIS_KEY_PREFIX') || 'medical:',
    };

    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      keyPrefix: config.keyPrefix,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis client error:', error);
    });
  }

  private async validateConnection(): Promise<void> {
    try {
      await this.client.ping();
    } catch (error) {
      this.logger.error('Cache connection validation failed:', error);
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error(`Failed to get cache key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.client.set(key, serializedValue, 'EX', ttl);
      } else if (this.defaultTTL) {
        await this.client.set(key, serializedValue, 'EX', this.defaultTTL);
      } else {
        await this.client.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      this.logger.error(`Failed to set cache key ${key}:`, error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete cache key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error(`Failed to check existence of cache key ${key}:`, error);
      return false;
    }
  }

  async clear(pattern?: string): Promise<boolean> {
    try {
      if (pattern) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } else {
        await this.client.flushdb();
      }
      return true;
    } catch (error) {
      this.logger.error('Failed to clear cache:', error);
      return false;
    }
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error('Cache client not initialized');
    }
    return this.client;
  }
} 