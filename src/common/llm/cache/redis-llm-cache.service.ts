import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Redis, RedisOptions } from 'ioredis';
import { createHash } from 'crypto';

/**
 * Cache entry for LLM responses.
 */
export interface ICacheEntry {
  readonly response: string;
  readonly tokenUsage: number;
  readonly provider: string;
  readonly timestamp: number;
  readonly expiresAt: number;
}

/**
 * Cache statistics response.
 */
export interface ICacheStats {
  readonly totalEntries: number;
  readonly totalSize: number;
  readonly oldestEntry: number;
  readonly newestEntry: number;
}

/**
 * Service for caching LLM responses in Redis.
 */
@Injectable()
export class RedisLLMCacheService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly defaultTTL: number = 24 * 60 * 60; // 24 hours in seconds
  private readonly keyPrefix: string = 'llm:cache:';

  public constructor() {
    const options: RedisOptions = {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB ?? '0', 10),
      keyPrefix: this.keyPrefix,
      retryStrategy: (times: number): number => {
        return Math.min(times * 50, 2000);
      },
    };

    this.redis = new Redis(options);

    this.redis.on('error', (error: Error): void => {
      console.error('Redis cache error:', error);
    });
  }

  /**
   * Generates a cache key from a prompt and provider.
   * 
   * @param prompt - The prompt to generate a key for
   * @param provider - The provider to generate a key for
   * @returns The generated cache key
   */
  private generateKey(prompt: string, provider: string): string {
    return createHash('sha256')
      .update(`${provider}:${prompt}`)
      .digest('hex');
  }

  /**
   * Gets a cached response.
   * 
   * @param prompt - The prompt to get the response for
   * @param provider - The provider to get the response for
   * @returns The cached entry or null if not found
   */
  public async get(prompt: string, provider: string): Promise<ICacheEntry | null> {
    try {
      const key: string = this.generateKey(prompt, provider);
      const data: string | null = await this.redis.get(key);

      if (!data) {
        return null;
      }

      const entry: ICacheEntry = JSON.parse(data);
      const now: number = Date.now();

      if (entry.expiresAt && entry.expiresAt < now) {
        await this.delete(prompt, provider);
        return null;
      }

      return entry;
    } catch (error) {
      console.error('Error retrieving from cache:', error);
      return null;
    }
  }

  /**
   * Sets a response in the cache.
   * 
   * @param prompt - The prompt to cache the response for
   * @param provider - The provider to cache the response for
   * @param response - The response to cache
   * @param tokenUsage - The token usage of the response
   * @param ttlSeconds - Time to live in seconds (optional)
   */
  public async set(
    prompt: string,
    provider: string,
    response: string,
    tokenUsage: number,
    ttlSeconds: number = this.defaultTTL,
  ): Promise<void> {
    try {
      const key: string = this.generateKey(prompt, provider);
      const now: number = Date.now();
      const entry: ICacheEntry = {
        response,
        tokenUsage,
        provider,
        timestamp: now,
        expiresAt: now + ttlSeconds * 1000,
      };

      await this.redis.set(key, JSON.stringify(entry), 'EX', ttlSeconds);
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }

  /**
   * Deletes a cached response.
   * 
   * @param prompt - The prompt to delete the response for
   * @param provider - The provider to delete the response for
   */
  public async delete(prompt: string, provider: string): Promise<void> {
    try {
      const key: string = this.generateKey(prompt, provider);
      await this.redis.del(key);
    } catch (error) {
      console.error('Error deleting from cache:', error);
    }
  }

  /**
   * Clears all cached responses.
   */
  public async clear(): Promise<void> {
    try {
      const keys: string[] = await this.redis.keys(`${this.keyPrefix}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Gets statistics about the cache.
   * 
   * @returns Cache statistics
   */
  public async getStats(): Promise<ICacheStats> {
    try {
      const keys: string[] = await this.redis.keys(`${this.keyPrefix}*`);
      let totalSize: number = 0;
      let oldestEntry: number = Date.now();
      let newestEntry: number = 0;

      for (const key of keys) {
        const data: string | null = await this.redis.get(key);
        if (data) {
          totalSize += Buffer.byteLength(data);
          const entry: ICacheEntry = JSON.parse(data);
          oldestEntry = Math.min(oldestEntry, entry.timestamp);
          newestEntry = Math.max(newestEntry, entry.timestamp);
        }
      }

      return {
        totalEntries: keys.length,
        totalSize,
        oldestEntry,
        newestEntry,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalEntries: 0,
        totalSize: 0,
        oldestEntry: 0,
        newestEntry: 0,
      };
    }
  }

  /**
   * Cleans up old entries from the cache.
   * 
   * @param maxAge - Maximum age of entries in milliseconds
   * @returns Number of entries removed
   */
  public async cleanup(maxAge: number = this.defaultTTL * 1000): Promise<number> {
    try {
      const keys: string[] = await this.redis.keys(`${this.keyPrefix}*`);
      const now: number = Date.now();
      let deletedCount: number = 0;

      for (const key of keys) {
        const data: string | null = await this.redis.get(key);
        if (data) {
          const entry: ICacheEntry = JSON.parse(data);
          if (now - entry.timestamp > maxAge) {
            await this.redis.del(key);
            deletedCount++;
          }
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up cache:', error);
      return 0;
    }
  }

  /**
   * Cleanup when the module is destroyed.
   */
  public async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
} 