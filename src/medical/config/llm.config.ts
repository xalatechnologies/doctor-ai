export interface LLMConfig {
  enabled: boolean;
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  priority?: number;  // Lower number = higher priority
  timeout?: number;   // In milliseconds
  baseURL?: string;   // For different API endpoints
}

export interface LLMsConfig {
  openai: LLMConfig;
  anthropic: LLMConfig;
  deepseek: LLMConfig;
  cohere: LLMConfig;  // Added for medical expertise
  [key: string]: LLMConfig | undefined;
}

export const defaultLLMConfig: LLMsConfig = {
  openai: {
    enabled: true,
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4-turbo-preview',  // Latest model with enhanced medical knowledge
    temperature: 0.3,
    maxTokens: 4000,
    priority: 1,
    timeout: 30000
  },
  anthropic: {
    enabled: true,
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: 'claude-3-opus-20240229',  // Latest Claude with strong medical capabilities
    temperature: 0.3,
    maxTokens: 4000,
    priority: 2,
    timeout: 30000
  },
  deepseek: {
    enabled: true,
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    model: 'deepseek-chat',  // This is DeepSeek-V3 as per docs
    baseURL: 'https://api.deepseek.com',
    temperature: 0.3,
    maxTokens: 4000,
    priority: 2,
    timeout: 30000
  },
  cohere: {
    enabled: true,
    apiKey: process.env.COHERE_API_KEY || '',
    model: 'command-nightly',  // Latest model with strong medical domain knowledge
    temperature: 0.3,
    maxTokens: 4000,
    priority: 3,
    timeout: 30000
  }
}; 