import { ProviderName } from '../errors/error-utils';

/**
 * Configuration for an LLM provider.
 */
export interface ILLMProviderConfig {
  readonly apiKey: string;
  readonly model?: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly endpoint?: string;
  readonly deploymentName?: string;
  readonly organizationId?: string;
  readonly timeout?: number;
}

/**
 * Response from an LLM provider.
 */
export interface ILLMResponse {
  readonly content: string;
  readonly tokenUsage: number;
  readonly provider: ProviderName;
}

/**
 * Interface for LLM providers.
 */
export interface ILLMProvider {
  initialize(config?: ILLMProviderConfig): Promise<void>;
  isAvailable(): Promise<boolean>;
  generateResponse(prompt: string, systemPrompt?: string): Promise<ILLMResponse>;
  getName(): ProviderName;
}

// Type aliases for backward compatibility
export type LLMProviderConfig = ILLMProviderConfig;
export type LLMResponse = ILLMResponse;
export type LLMProvider = ILLMProvider; 