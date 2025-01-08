import { Injectable } from '@nestjs/common';
import { CohereClient } from 'cohere-ai';
import { LLMProvider, LLMProviderConfig, LLMResponse } from './llm-provider.interface';
import {
  LLMProviderError,
  ProviderAuthenticationError,
  ProviderRateLimitError,
  ProviderQuotaExceededError,
  ProviderContentFilterError,
  ProviderResponseParseError,
} from '../errors/provider-errors';
import { ProviderName } from '../errors/error-utils';

/**
 * Cohere model configuration.
 */
interface ICohereConfig extends Required<LLMProviderConfig> {
  readonly model: string;
}

/**
 * Cohere error response.
 */
interface ICohereErrorResponse {
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly status?: string;
  readonly type?: string;
}

@Injectable()
export class CohereProvider implements LLMProvider {
  private client!: CohereClient;
  private config!: ICohereConfig;
  private isInitialized = false;

  async initialize(config?: LLMProviderConfig): Promise<void> {
    const apiKey = config?.apiKey || process.env.COHERE_API_KEY;
    const model = config?.model || process.env.COHERE_MODEL || 'command';
    const temperature = config?.temperature ?? parseFloat(process.env.COHERE_TEMPERATURE || '0.7');
    const maxTokens = config?.maxTokens ?? parseInt(process.env.COHERE_MAX_TOKENS || '2000', 10);
    const timeout = config?.timeout ?? parseInt(process.env.COHERE_TIMEOUT || '30000', 10);

    if (!apiKey) {
      throw new ProviderAuthenticationError('cohere', 'API key not provided');
    }

    this.config = {
      apiKey,
      model,
      temperature,
      maxTokens,
      timeout,
      endpoint: config?.endpoint || '',
      deploymentName: config?.deploymentName || '',
      organizationId: config?.organizationId || '',
    };

    this.client = new CohereClient({
      token: this.config.apiKey,
    });

    this.isInitialized = true;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      await this.client.generate({
        prompt: 'test',
        model: this.config.model,
        maxTokens: 1,
      });
      return true;
    } catch (error) {
      console.error('Cohere availability check failed:', error);
      return false;
    }
  }

  async generateResponse(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
    if (!this.isInitialized) {
      throw new LLMProviderError('Cohere provider not initialized', 'cohere');
    }

    try {
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

      const response = await this.client.generate({
        prompt: fullPrompt,
        model: this.config.model,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      });

      if (!response.generations?.[0]?.text) {
        throw new ProviderResponseParseError('cohere', 'No text content in response');
      }

      return {
        content: response.generations[0].text,
        tokenUsage: (response.meta?.billedUnits?.inputTokens || 0) + (response.meta?.billedUnits?.outputTokens || 0),
        provider: this.getName(),
      };
    } catch (error) {
      if (error instanceof LLMProviderError) {
        throw error;
      }

      if (error instanceof Error) {
        const errorResponse = error as ICohereErrorResponse;
        const status = typeof errorResponse.status === 'string'
          ? errorResponse.status
          : String((error as { status?: number })?.status || 500);

        switch (status) {
          case 'TOO_MANY_REQUESTS':
            throw new ProviderRateLimitError('cohere');
          case 'UNAUTHORIZED':
            throw new ProviderAuthenticationError('cohere', error.message);
          case 'QUOTA_EXCEEDED':
            throw new ProviderQuotaExceededError('cohere');
          case 'SAFETY':
            throw new ProviderContentFilterError('cohere', error.message);
          default:
            throw new LLMProviderError(error.message, 'cohere', undefined, {
              status,
              type: errorResponse.type || 'api_error',
              details: errorResponse.details || {},
            });
        }
      }

      throw new LLMProviderError('Unknown error occurred', 'cohere', undefined, {
        type: 'api_error',
        status: '500',
      });
    }
  }

  getName(): ProviderName {
    return 'cohere';
  }
} 