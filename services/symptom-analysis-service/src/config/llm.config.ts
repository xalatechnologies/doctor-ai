export interface LLMConfig {
  enabled: boolean;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  priority: number;
  baseURL?: string;
}

export interface LLMsConfig {
  openai: LLMConfig;
  anthropic: LLMConfig;
  deepseek: LLMConfig;
  cohere: LLMConfig;
}

export const defaultLLMConfig: LLMsConfig = {
  openai: {
    enabled: true,
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4',
    temperature: 0.3,
    maxTokens: 1000,
    timeout: 30000,
    priority: 1
  },
  anthropic: {
    enabled: false,
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: 'claude-2',
    temperature: 0.3,
    maxTokens: 1000,
    timeout: 30000,
    priority: 2
  },
  deepseek: {
    enabled: false,
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    model: 'deepseek-chat',
    temperature: 0.3,
    maxTokens: 1000,
    timeout: 30000,
    priority: 3,
    baseURL: 'https://api.deepseek.com/v1'
  },
  cohere: {
    enabled: false,
    apiKey: process.env.COHERE_API_KEY || '',
    model: 'command',
    temperature: 0.3,
    maxTokens: 1000,
    timeout: 30000,
    priority: 4
  }
}; 