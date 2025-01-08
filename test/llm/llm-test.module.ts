import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LLMService } from '../../src/common/llm/llm.service';
import { OpenAIProvider } from '../../src/common/llm/providers/openai.provider';
import { AnthropicProvider } from '../../src/common/llm/providers/anthropic.provider';
import { GoogleGeminiProvider } from '../../src/common/llm/providers/google-gemini.provider';
import { GoogleMedPalmProvider } from '../../src/common/llm/providers/google-medpalm.provider';
import { CohereProvider } from '../../src/common/llm/providers/cohere.provider';
import { RateLimiterService } from '../../src/common/llm/rate-limiter.service';
import { RedisLLMCacheService } from '../../src/common/llm/cache/redis-llm-cache.service';
import { MockMetricsService } from './mock-metrics.service';
import { LoggerService } from '../../src/common/logger/logger.service';
import { MessagingService } from '../../src/common/messaging/messaging.service';
import { PrometheusService } from '../../src/common/monitoring/prometheus.service';
import { MetricsService } from '../../src/common/metrics/metrics.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test',
    }),
  ],
  providers: [
    {
      provide: MetricsService,
      useClass: MockMetricsService,
    },
    {
      provide: LoggerService,
      useValue: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      },
    },
    {
      provide: MessagingService,
      useValue: {
        publish: jest.fn(),
      },
    },
    {
      provide: PrometheusService,
      useValue: {
        incrementProviderError: jest.fn(),
        recordTaskMetrics: jest.fn(),
        recordModelMetrics: jest.fn(),
      },
    },
    {
      provide: RedisLLMCacheService,
      useValue: {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(undefined),
        clear: jest.fn().mockResolvedValue(undefined),
        getStats: jest.fn().mockResolvedValue({
          totalEntries: 0,
          totalSize: 0,
          oldestEntry: 0,
          newestEntry: 0,
        }),
        cleanup: jest.fn().mockResolvedValue(0),
      },
    },
    LLMService,
    OpenAIProvider,
    AnthropicProvider,
    GoogleGeminiProvider,
    GoogleMedPalmProvider,
    CohereProvider,
    RateLimiterService,
  ],
  exports: [LLMService],
})
export class LLMTestModule {} 