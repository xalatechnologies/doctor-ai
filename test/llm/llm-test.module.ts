import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LLMOrchestrationService } from '../../src/common/llm/llm-orchestration.service';
import { OpenAIProvider } from '../../src/common/llm/providers/openai.provider';
import { AzureOpenAIProvider } from '../../src/common/llm/providers/azure-openai.provider';
import { AnthropicProvider } from '../../src/common/llm/providers/anthropic.provider';
import { RateLimiterService } from '../../src/common/llm/rate-limiter.service';
import { MockMetricsService } from './mock-metrics.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test',
    }),
  ],
  providers: [
    {
      provide: 'MetricsService',
      useClass: MockMetricsService,
    },
    LLMOrchestrationService,
    OpenAIProvider,
    AzureOpenAIProvider,
    AnthropicProvider,
    RateLimiterService,
  ],
  exports: [LLMOrchestrationService],
})
export class LLMTestModule {} 