declare module '../config/llm.config' {
  export interface LLMConfig {
    enabled: boolean;
    apiKey: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
    priority?: number;
    baseURL?: string;
  }

  export interface LLMsConfig {
    openai?: LLMConfig;
    anthropic?: LLMConfig;
    deepseek?: LLMConfig;
    cohere?: LLMConfig;
  }

  export const defaultLLMConfig: LLMsConfig;
}

declare module '../utils/medical-terminology' {
  export class MedicalTerminology {
    static extractTerms(text: string): Set<string>;
    static validateTerm(term: string): boolean;
    static getSuggestions(term: string): string[];
  }
}

declare module './metrics.service' {
  import { Injectable } from '@nestjs/common';
  import { LLMProvider } from './llm-orchestration.service';

  export interface ProviderMetrics {
    successRate: number;
    averageLatency: number;
    errorRate: number;
    totalRequests: number;
    domainAccuracy: Record<string, number>;
  }

  @Injectable()
  export class MetricsService {
    logProviderFailure(provider: LLMProvider): Promise<void>;
    getProviderMetrics(provider: LLMProvider): ProviderMetrics | undefined;
    updateProviderMetrics(provider: LLMProvider, latency: number, success: boolean, domain?: string): void;
    getProviderRanking(domain?: string): LLMProvider[];
    resetMetrics(): void;
  }
}

declare module './translation.service' {
  import { Injectable } from '@nestjs/common';

  @Injectable()
  export class TranslationService {
    translate(content: string, targetLanguage: string): Promise<string>;
  }
}

declare module '../config/medical-prompts.config' {
  import { LLMProvider } from '../services/llm-orchestration.service';

  interface ProviderPrompts {
    systemPrompt: string;
    domainValidation: string;
  }

  export const medicalPrompts: Record<LLMProvider, ProviderPrompts>;
} 