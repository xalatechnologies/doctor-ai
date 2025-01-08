import { Injectable } from '@nestjs/common';
import { LLMCache, LLMCacheKey, LLMCacheEntry } from './llm-cache.interface';
import { LLMResponse } from '../providers/llm-provider.interface';

@Injectable()
export class MemoryLLMCache implements LLMCache {
  private cache: Map<string, LLMCacheEntry> = new Map();

  private generateKey(key: LLMCacheKey): string {
    return JSON.stringify({
      prompt: key.prompt,
      provider: key.provider,
      model: key.model,
      temperature: key.temperature,
    });
  }

  async get(key: LLMCacheKey): Promise<LLMResponse | null> {
    const cacheKey = this.generateKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.timestamp + entry.ttl * 1000) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.response;
  }

  async set(key: LLMCacheKey, response: LLMResponse, ttlSeconds: number): Promise<void> {
    const cacheKey = this.generateKey(key);
    this.cache.set(cacheKey, {
      response,
      timestamp: Date.now(),
      ttl: ttlSeconds,
    });
  }

  async delete(key: LLMCacheKey): Promise<void> {
    const cacheKey = this.generateKey(key);
    this.cache.delete(cacheKey);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  // Cleanup expired entries
  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl * 1000) {
        this.cache.delete(key);
      }
    }
  }
} 