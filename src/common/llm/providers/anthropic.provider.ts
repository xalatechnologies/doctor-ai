import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, LLMProviderConfig, LLMResponse } from './llm-provider.interface';
import {
  LLMProviderError,
  ProviderAuthenticationError,
  ProviderRateLimitError,
  ProviderContextLengthError,
  ProviderResponseParseError,
} from '../errors/provider-errors';
import { ProviderName } from '../errors/error-utils';

/**
 * Anthropic model configuration.
 */
interface IAnthropicConfig extends Required<LLMProviderConfig> {
  readonly model: string;
}

/**
 * Anthropic error response.
 */
interface IAnthropicErrorResponse {
  readonly error?: {
    readonly type: string;
    readonly message: string;
    readonly code?: string;
    readonly param?: string;
    readonly max_tokens?: number;
  };
}

@Injectable()
export class AnthropicProvider implements LLMProvider {
  private client!: Anthropic;
  private config!: IAnthropicConfig;
  private isInitialized = false;

  async initialize(config?: LLMProviderConfig): Promise<void> {
    const apiKey = config?.apiKey || process.env.ANTHROPIC_API_KEY;
    const model = config?.model || process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229';
    const temperature = config?.temperature ?? parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.7');
    const maxTokens = config?.maxTokens ?? parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4000', 10);
    const timeout = config?.timeout ?? parseInt(process.env.ANTHROPIC_TIMEOUT || '30000', 10);

    if (!apiKey) {
      throw new ProviderAuthenticationError('anthropic', 'API key not provided');
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

    this.client = new Anthropic({
      apiKey: this.config.apiKey,
      maxRetries: 3,
    });

    this.isInitialized = true;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      await this.client.messages.create({
        model: this.config.model as Anthropic.Messages.MessageCreateParams['model'],
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }],
      });
      return true;
    } catch (error) {
      console.error('Anthropic availability check failed:', error);
      return false;
    }
  }

  async generateResponse(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
    if (!this.isInitialized) {
      throw new LLMProviderError('Anthropic provider not initialized', 'anthropic');
    }

    try {
      const messages: Anthropic.Messages.MessageParam[] = [
        { role: 'user', content: prompt },
      ];

      if (systemPrompt) {
        messages.unshift({ role: 'assistant', content: systemPrompt });
      }

      const response = await this.client.messages.create({
        model: this.config.model as Anthropic.Messages.MessageCreateParams['model'],
        messages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      });

      if (!response.content[0] || !('text' in response.content[0])) {
        throw new ProviderResponseParseError('anthropic', 'No text content in response');
      }

      return {
        content: response.content[0].text,
        tokenUsage: response.usage?.input_tokens || 0,
        provider: this.getName(),
      };
    } catch (error) {
      if (error instanceof LLMProviderError) {
        throw error;
      }

      if (error instanceof Error) {
        const errorResponse = (error as { response?: { data: IAnthropicErrorResponse } })?.response?.data;
        const errorCode = errorResponse?.error?.code || 'unknown';
        const errorType = errorResponse?.error?.type || 'api_error';

        switch (errorCode) {
          case 'rate_limit_error':
            throw new ProviderRateLimitError('anthropic');
          case 'authentication_error':
            throw new ProviderAuthenticationError('anthropic', error.message);
          case 'context_length_exceeded':
            throw new ProviderContextLengthError('anthropic', errorResponse?.error?.max_tokens ?? 4096);
          default:
            throw new LLMProviderError(error.message, 'anthropic', undefined, {
              code: errorCode,
              type: errorType,
              status: (error as { status?: number })?.status || 500,
            });
        }
      }

      throw new LLMProviderError('Unknown error occurred', 'anthropic', undefined, {
        type: 'api_error',
        status: 500,
      });
    }
  }

  getName(): ProviderName {
    return 'anthropic';
  }
}
