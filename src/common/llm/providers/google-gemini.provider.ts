import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider, LLMProviderConfig, LLMResponse } from './llm-provider.interface';
import {
  LLMProviderError,
  ProviderAuthenticationError,
  ProviderQuotaExceededError,
  ProviderContentFilterError,
  ProviderResponseParseError,
} from '../errors/provider-errors';
import { ProviderName } from '../errors/error-utils';

/**
 * Google Gemini model configuration.
 */
interface IGeminiConfig extends Required<LLMProviderConfig> {
  readonly model: string;
}

/**
 * Google Gemini error response.
 */
interface IGeminiErrorResponse {
  readonly error?: {
    readonly message: string;
    readonly status: number;
    readonly details?: Array<{
      readonly type: string;
      readonly reason?: string;
      readonly domain?: string;
      readonly metadata?: Record<string, unknown>;
    }>;
  };
}

@Injectable()
export class GoogleGeminiProvider implements LLMProvider {
  private client!: GoogleGenerativeAI;
  private config!: IGeminiConfig;
  private isInitialized = false;

  async initialize(config?: LLMProviderConfig): Promise<void> {
    const apiKey = config?.apiKey || process.env.GOOGLE_GEMINI_API_KEY;
    const model = config?.model || process.env.GOOGLE_GEMINI_MODEL || 'gemini-pro';
    const temperature = config?.temperature ?? parseFloat(process.env.GOOGLE_GEMINI_TEMPERATURE || '0.7');
    const maxTokens = config?.maxTokens ?? parseInt(process.env.GOOGLE_GEMINI_MAX_TOKENS || '2048', 10);
    const timeout = config?.timeout ?? parseInt(process.env.GOOGLE_GEMINI_TIMEOUT || '30000', 10);

    if (!apiKey) {
      throw new ProviderAuthenticationError('google-gemini', 'API key not provided');
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

    this.client = new GoogleGenerativeAI(this.config.apiKey);
    this.isInitialized = true;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      const model = this.client.getGenerativeModel({ model: this.config.model });
      await model.generateContent('test');
      return true;
    } catch (error) {
      console.error('Google Gemini availability check failed:', error);
      return false;
    }
  }

  async generateResponse(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
    if (!this.isInitialized) {
      throw new LLMProviderError('Google Gemini provider not initialized', 'google-gemini');
    }

    try {
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
      const model = this.client.getGenerativeModel({
        model: this.config.model,
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxTokens,
        },
      });

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new ProviderResponseParseError('google-gemini', 'No text content in response');
      }

      // Note: Gemini API currently doesn't provide token usage information
      // We'll estimate it based on character count (rough approximation)
      const estimatedTokens = Math.ceil((fullPrompt.length + text.length) / 4);

      return {
        content: text,
        tokenUsage: estimatedTokens,
        provider: this.getName(),
      };
    } catch (error) {
      if (error instanceof LLMProviderError) {
        throw error;
      }

      if (error instanceof Error) {
        const errorResponse = (error as { response?: { data: IGeminiErrorResponse } })?.response?.data;
        const errorMessage = error.message.toLowerCase();
        const errorDetails = errorResponse?.error?.details?.[0];

        if (errorMessage.includes('quota exceeded') || errorDetails?.reason === 'QUOTA_EXCEEDED') {
          throw new ProviderQuotaExceededError('google-gemini');
        }
        if (errorMessage.includes('permission denied') || errorDetails?.reason === 'PERMISSION_DENIED') {
          throw new ProviderAuthenticationError('google-gemini', error.message);
        }
        if (errorMessage.includes('content filtered') || errorDetails?.reason === 'SAFETY') {
          throw new ProviderContentFilterError('google-gemini', 'Content filtered by Gemini');
        }

        throw new LLMProviderError(error.message, 'google-gemini', undefined, {
          type: errorDetails?.type || 'api_error',
          status: errorResponse?.error?.status || 500,
          details: {
            domain: errorDetails?.domain,
            reason: errorDetails?.reason,
            metadata: errorDetails?.metadata,
          },
        });
      }

      throw new LLMProviderError('Unknown error occurred', 'google-gemini', undefined, {
        type: 'api_error',
        status: 500,
      });
    }
  }

  getName(): ProviderName {
    return 'google-gemini';
  }
}
