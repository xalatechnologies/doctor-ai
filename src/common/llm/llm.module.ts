import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LLMOrchestrationService } from './llm-orchestration.service';
import { MetricsModule } from '../metrics/metrics.module';
import { OpenAIProvider } from './providers/openai.provider';
import { AzureOpenAIProvider } from './providers/azure-openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GooglePalmProvider } from './providers/google-palm.provider';
import { GoogleGeminiProvider } from './providers/google-gemini.provider';
import { DeepseekProvider } from './providers/deepseek.provider';
import { RateLimiterService } from './rate-limiter.service';

@Module({
  imports: [
    ConfigModule,
    MetricsModule,
  ],
  providers: [
    LLMOrchestrationService,
    OpenAIProvider,
    AzureOpenAIProvider,
    AnthropicProvider,
    GooglePalmProvider,
    GoogleGeminiProvider,
    DeepseekProvider,
    RateLimiterService,
  ],
  exports: [LLMOrchestrationService],
})
export class LLMModule {} 