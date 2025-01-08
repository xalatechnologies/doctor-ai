import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { LLMProvider, LLMProviderConfig, LLMResponse } from './llm-provider.interface';
import {
  LLMProviderError,
  ProviderAuthenticationError,
  ProviderRateLimitError,
  ProviderQuotaExceededError,
  ProviderContentFilterError,
  ProviderContextLengthError,
  ProviderResponseParseError,
} from '../errors/provider-errors';
import { MetricsService } from '../../metrics/metrics.service';
import { ProviderName } from '../errors/error-utils';

/**
 * OpenAI model configuration.
 */
interface IOpenAIConfig extends Required<LLMProviderConfig> {
  readonly model: string;
}

/**
 * OpenAI error response.
 */
interface IOpenAIErrorResponse {
  readonly error?: {
    readonly message?: string;
    readonly type?: string;
    readonly code?: string;
    readonly param?: string;
    readonly max_tokens?: number;
  };
}

@Injectable()
export class OpenAIProvider implements LLMProvider {
  private client!: OpenAI;
  private config!: IOpenAIConfig;
  private isInitialized = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
  ) {}

  async initialize(config?: LLMProviderConfig): Promise<void> {
    const apiKey = config?.apiKey || this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new ProviderAuthenticationError('openai', 'API key not found in configuration');
    }

    this.client = new OpenAI({ apiKey });

    this.config = {
      apiKey,
      model: config?.model || this.configService.get<string>('OPENAI_MODEL', 'gpt-4'),
      temperature: config?.temperature ?? this.configService.get<number>('OPENAI_TEMPERATURE', 0.7),
      maxTokens: config?.maxTokens ?? this.configService.get<number>('OPENAI_MAX_TOKENS', 2000),
      endpoint: config?.endpoint || '',
      deploymentName: config?.deploymentName || '',
      organizationId: config?.organizationId || '',
      timeout: config?.timeout ?? 30000,
    };

    this.isInitialized = true;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      console.error('OpenAI availability check failed:', error);
      return false;
    }
  }

  async generateResponse(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
    if (!this.isInitialized) {
      throw new LLMProviderError('OpenAI provider not initialized', 'openai');
    }

    const startTime = Date.now();
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
          { role: 'user' as const, content: prompt },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      });

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('openai', 'generate_response', duration);

      if (!response.choices[0]?.message?.content) {
        throw new ProviderResponseParseError('openai', 'No response generated from OpenAI');
      }

      return {
        content: response.choices[0].message.content,
        tokenUsage: response.usage?.total_tokens || 0,
        provider: this.getName(),
      };
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('openai', 'generate_response_error', duration);

      if (error instanceof LLMProviderError) {
        throw error;
      }

      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        const errorResponse = (error as { response?: { data: IOpenAIErrorResponse } })?.response?.data;
        const errorCode = errorResponse?.error?.code;
        const status = (error as { status?: number })?.status || 500;

        if (errorMessage.includes('rate limit')) {
          const retryAfter = (error as { response?: { headers: { 'retry-after'?: string } } })?.response?.headers?.['retry-after'];
          throw new ProviderRateLimitError('openai', retryAfter ? parseInt(retryAfter, 10) * 1000 : undefined);
        }
        if (errorMessage.includes('authentication')) {
          throw new ProviderAuthenticationError('openai', error.message);
        }
        if (errorMessage.includes('quota exceeded')) {
          throw new ProviderQuotaExceededError('openai');
        }
        if (errorMessage.includes('content filter')) {
          throw new ProviderContentFilterError('openai', errorResponse?.error?.message ?? 'Content filtered');
        }
        if (errorMessage.includes('context length')) {
          throw new ProviderContextLengthError('openai', errorResponse?.error?.max_tokens ?? 4096);
        }

        throw new LLMProviderError(error.message, 'openai', undefined, {
          code: errorCode,
          status,
          type: errorResponse?.error?.type || 'api_error',
        });
      }

      throw new LLMProviderError('Unknown error occurred', 'openai', undefined, {
        type: 'api_error',
        status: 500,
      });
    }
  }

  getName(): ProviderName {
    return 'openai';
  }
}
