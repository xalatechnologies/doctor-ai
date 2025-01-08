import { Module } from '@nestjs/common';
import { RedisLLMCacheService } from './redis-llm-cache.service';

@Module({
  providers: [RedisLLMCacheService],
  exports: [RedisLLMCacheService],
})
export class LLMCacheModule {} 