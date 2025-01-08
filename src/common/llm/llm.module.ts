import { Module } from '@nestjs/common';
import { LLMCacheModule } from './cache/llm-cache.module';
import { LLMService } from './llm.service';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { CohereProvider } from './providers/cohere.provider';
import { GoogleGeminiProvider } from './providers/google-gemini.provider';
import { GoogleMedPalmProvider } from './providers/google-medpalm.provider';

@Module({
  imports: [LLMCacheModule],
  providers: [
    LLMService,
    OpenAIProvider,
    AnthropicProvider,
    CohereProvider,
    GoogleGeminiProvider,
    GoogleMedPalmProvider,
  ],
  exports: [LLMService],
})
export class LLMModule {}
