import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class CacheService implements OnModuleInit {
  private client!: Redis;

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
  ) {}

  async onModuleInit(): Promise<void> {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      throw new Error('Redis URL not provided');
    }

    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    try {
      await this.client.ping();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    try {
      const value = await this.client.get(key);
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('redis', 'get', duration);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('redis', 'get_error', duration);
      throw error;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const startTime = Date.now();
    try {
      const serializedValue = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('redis', 'set', duration);
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('redis', 'set_error', duration);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    const startTime = Date.now();
    try {
      await this.client.del(key);
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('redis', 'delete', duration);
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('redis', 'delete_error', duration);
      throw error;
    }
  }

  async clear(): Promise<void> {
    const startTime = Date.now();
    try {
      await this.client.flushdb();
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('redis', 'clear', duration);
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('redis', 'clear_error', duration);
      throw error;
    }
  }

  async getStats(): Promise<{
    totalEntries: number;
    totalSize: number;
    oldestEntry: number;
    newestEntry: number;
  }> {
    const startTime = Date.now();
    try {
      const info = await this.client.info('keyspace');
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('redis', 'stats', duration);

      // Parse Redis INFO output
      const keyspace = info
        .split('\n')
        .find((line) => line.startsWith('db0:'))
        ?.split(',')
        .reduce((acc, curr) => {
          const [key, value] = curr.split('=');
          acc[key.trim()] = parseInt(value, 10);
          return acc;
        }, {} as Record<string, number>);

      return {
        totalEntries: keyspace?.keys || 0,
        totalSize: keyspace?.bytes || 0,
        oldestEntry: keyspace?.expires_at_min || 0,
        newestEntry: keyspace?.expires_at_max || 0,
      };
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('redis', 'stats_error', duration);
      throw error;
    }
  }

  async cleanup(maxAgeMs: number): Promise<number> {
    const startTime = Date.now();
    try {
      const keys = await this.client.keys('*');
      let deletedCount = 0;

      for (const key of keys) {
        const ttl = await this.client.ttl(key);
        if (ttl === -1 || ttl * 1000 > maxAgeMs) {
          await this.client.del(key);
          deletedCount++;
        }
      }

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('redis', 'cleanup', duration);
      return deletedCount;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('redis', 'cleanup_error', duration);
      throw error;
    }
  }
}
