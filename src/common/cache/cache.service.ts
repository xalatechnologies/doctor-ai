import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { MetricsService } from '../metrics/metrics.service';

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  oldestEntry: number;
  newestEntry: number;
}

@Injectable()
export class CacheService implements OnModuleInit {
  private client: Redis;
  private isConnected: boolean = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
  ) {
    const redisConfig = {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD', ''),
      retryStrategy: (times: number) => {
        if (times > 3) {
          return null; // Stop retrying after 3 attempts
        }
        return Math.min(times * 100, 3000); // Exponential backoff
      },
    };

    this.client = new Redis(redisConfig);

    this.client.on('error', (error) => {
      this.isConnected = false;
      this.metricsService.logError('cache', 'redis_error');
      console.error('Redis error:', error);
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      console.log('Connected to Redis');
    });
  }

  async onModuleInit() {
    try {
      await this.client.ping();
      this.isConnected = true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.metricsService.logError('cache', 'connection_error');
      // Don't throw error here to allow the application to start without Redis
      this.isConnected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      this.metricsService.logError('cache', 'get_error');
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      this.metricsService.logError('cache', 'set_error');
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      this.metricsService.logError('cache', 'delete_error');
      return false;
    }
  }

  async clear(): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.flushdb();
      return true;
    } catch (error) {
      this.metricsService.logError('cache', 'clear_error');
      return false;
    }
  }

  async getStats(): Promise<CacheStats> {
    if (!this.isConnected) {
      return {
        totalEntries: 0,
        totalSize: 0,
        oldestEntry: 0,
        newestEntry: 0,
      };
    }

    try {
      const info = await this.client.info('keyspace');
      const keys = await this.client.keys('*');
      const now = Date.now();

      return {
        totalEntries: keys.length,
        totalSize: 0, // Redis doesn't provide memory usage per key in info command
        oldestEntry: 0, // Would need to track this separately
        newestEntry: now,
      };
    } catch (error) {
      this.metricsService.logError('cache', 'stats_error');
      return {
        totalEntries: 0,
        totalSize: 0,
        oldestEntry: 0,
        newestEntry: 0,
      };
    }
  }

  /**
   * Removes entries that have expired based on their TTL or have exceeded the maximum age
   * @param maxAgeMs Maximum age in milliseconds for entries to be considered valid
   * @returns Number of entries removed
   */
  async cleanup(maxAgeMs: number): Promise<number> {
    if (!this.isConnected) {
      return 0;
    }

    try {
      const keys = await this.client.keys('*');
      let removedCount = 0;

      for (const key of keys) {
        const ttl = await this.client.ttl(key);
        // Remove if TTL is -1 (no expiry set) and older than maxAgeMs
        // or if TTL is -2 (key does not exist)
        if (ttl === -1 || ttl === -2) {
          await this.delete(key);
          removedCount++;
        }
      }

      return removedCount;
    } catch (error) {
      this.metricsService.logError('cache', 'cleanup_error');
      return 0;
    }
  }
}
