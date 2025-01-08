import { LLMResponse } from '../providers/llm-provider.interface';

export interface LLMCacheKey {
  prompt: string;
  provider: string;
  model?: string;
  temperature?: number;
}

export interface LLMCacheEntry {
  response: LLMResponse;
  timestamp: number;
  ttl: number;
}

export interface LLMCache {
  get(key: LLMCacheKey): Promise<LLMResponse | null>;
  set(key: LLMCacheKey, response: LLMResponse, ttlSeconds: number): Promise<void>;
  delete(key: LLMCacheKey): Promise<void>;
  clear(): Promise<void>;
} 