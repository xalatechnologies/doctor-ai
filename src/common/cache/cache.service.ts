import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private client: Redis;

  async onModuleInit() {
    // Initialize Redis client
    this.client = new Redis();
  }

  getClient(): Redis {
    return this.client;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    if (ttl) {
      await this.client.setex(key, ttl, serializedValue);
    } else {
      await this.client.set(key, serializedValue);
    }
  }

  async get(key: string): Promise<any> {
    const value = await this.client.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value; // Return raw value if not JSON
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async increment(key: string, by = 1): Promise<number> {
    return this.client.incrby(key, by);
  }

  async listPush(key: string, value: string): Promise<number> {
    return this.client.rpush(key, value);
  }

  async listPop(key: string): Promise<string | null> {
    return this.client.rpop(key);
  }

  async listRange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.lrange(key, start, stop);
  }

  async setAdd(key: string, ...members: string[]): Promise<number> {
    return this.client.sadd(key, ...members);
  }

  async setIsMember(key: string, member: string): Promise<boolean> {
    const result = await this.client.sismember(key, member);
    return result === 1;
  }

  async setMembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  async hashSet(key: string, fields: Record<string, string>): Promise<number> {
    return this.client.hset(key, fields);
  }

  async hashGet(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  async hashGetAll(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }
} 