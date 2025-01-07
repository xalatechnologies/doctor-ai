export interface LLMConfig {
  enabled: boolean;
  apiKey?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  retries: number;
  concurrentRequests: number;
}

export interface LLMsConfig {
  openai?: LLMConfig;
  anthropic?: LLMConfig;
  deepseek?: LLMConfig;
  cohere?: LLMConfig;
}

export const defaultLLMConfig: LLMsConfig = {
  openai: {
    enabled: true,
    model: 'gpt-4',
    temperature: 0.3,
    maxTokens: 1000,
    timeout: 30000,
    retries: 3,
    concurrentRequests: 5
  },
  anthropic: {
    enabled: true,
    model: 'claude-2',
    temperature: 0.3,
    maxTokens: 1000,
    timeout: 30000,
    retries: 3,
    concurrentRequests: 5
  },
  deepseek: {
    enabled: false,
    model: 'deepseek-chat',
    temperature: 0.3,
    maxTokens: 1000,
    timeout: 30000,
    retries: 3,
    concurrentRequests: 5
  },
  cohere: {
    enabled: false,
    model: 'command',
    temperature: 0.3,
    maxTokens: 1000,
    timeout: 30000,
    retries: 3,
    concurrentRequests: 5
  }
}; 