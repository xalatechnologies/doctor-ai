import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisLLMCacheService } from './cache/redis-llm-cache.service';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { CohereProvider } from './providers/cohere.provider';
import { GoogleGeminiProvider } from './providers/google-gemini.provider';
import { GoogleMedPalmProvider } from './providers/google-medpalm.provider';
import { withRetry } from './errors/error-utils';
import { ILLMProvider } from './providers/llm-provider.interface';
import { ProviderName } from './errors/error-utils';
import { MetricsService } from '../metrics/metrics.service';
import {
  SYMPTOM_ANALYSIS_TEMPLATE,
  TEMPLATE_FINDING_TEMPLATE,
} from './prompts/medical-prompts';
import {
  OPENAI_MEDICAL_TEMPLATE,
  ANTHROPIC_MEDICAL_TEMPLATE,
  COHERE_MEDICAL_TEMPLATE,
  GEMINI_MEDICAL_TEMPLATE,
  MEDPALM_MEDICAL_TEMPLATE,
} from './prompts/provider-prompts';
import { IPromptTemplate } from './prompts/prompt-template.interface';

/**
 * Response from an LLM provider.
 */
export interface ILLMResponse {
  readonly content: string;
  readonly tokenUsage: number;
  readonly provider: ProviderName;
}

/**
 * Symptom data for analysis.
 */
export interface ISymptomData {
  readonly description: string;
  readonly severity?: number;
  readonly duration: string;
  readonly onset: string;
  readonly additionalNotes?: string;
}

/**
 * Cache statistics response.
 */
export interface ICacheStats {
  readonly totalEntries: number;
  readonly totalSize: number;
  readonly oldestEntry: number;
  readonly newestEntry: number;
}

/**
 * Service for managing LLM providers and generating responses.
 */
@Injectable()
export class LLMService implements OnModuleInit {
  private readonly providers: Map<ProviderName, ILLMProvider> = new Map();
  private readonly providerPrompts: Map<ProviderName, IPromptTemplate> = new Map();
  private readonly defaultProvider: ProviderName = 'openai';
  private readonly maxRetries: number = 3;

  public constructor(
    private readonly openaiProvider: OpenAIProvider,
    private readonly anthropicProvider: AnthropicProvider,
    private readonly cohereProvider: CohereProvider,
    private readonly geminiProvider: GoogleGeminiProvider,
    private readonly medpalmProvider: GoogleMedPalmProvider,
    private readonly cacheService: RedisLLMCacheService,
    private readonly metricsService: MetricsService,
  ) {}

  public async onModuleInit(): Promise<void> {
    this.providers.set('openai', this.openaiProvider);
    this.providers.set('anthropic', this.anthropicProvider);
    this.providers.set('cohere', this.cohereProvider);
    this.providers.set('google-gemini', this.geminiProvider);
    this.providers.set('google-medpalm', this.medpalmProvider);

    this.providerPrompts.set('openai', OPENAI_MEDICAL_TEMPLATE);
    this.providerPrompts.set('anthropic', ANTHROPIC_MEDICAL_TEMPLATE);
    this.providerPrompts.set('cohere', COHERE_MEDICAL_TEMPLATE);
    this.providerPrompts.set('google-gemini', GEMINI_MEDICAL_TEMPLATE);
    this.providerPrompts.set('google-medpalm', MEDPALM_MEDICAL_TEMPLATE);

    // Initialize all providers
    for (const [name, provider] of this.providers.entries()) {
      try {
        await provider.initialize();
        console.log(`Initialized ${name} provider`);
      } catch (error) {
        console.error(`Failed to initialize ${name} provider:`, error);
      }
    }
  }

  /**
   * Gets an available LLM provider.
   * 
   * @param preferredProvider - Optional preferred provider to use
   * @returns The name of an available provider
   * @throws Error if no providers are available
   */
  private async getAvailableProvider(preferredProvider?: ProviderName): Promise<ProviderName> {
    if (preferredProvider) {
      const provider = this.providers.get(preferredProvider);
      if (provider && (await provider.isAvailable())) {
        return preferredProvider;
      }
    }

    for (const [name, provider] of this.providers.entries()) {
      if (await provider.isAvailable()) {
        return name;
      }
    }

    throw new Error('No LLM providers available');
  }

  /**
   * Gets the prompt template for a provider and template type.
   * 
   * @param provider - The provider name
   * @param templateType - The type of template to get
   * @returns The prompt template
   * @throws Error if no template is found
   */
  private getProviderTemplate(provider: ProviderName, templateType: string): IPromptTemplate {
    const providerTemplate = this.providerPrompts.get(provider);
    if (!providerTemplate) {
      throw new Error(`No template found for provider ${provider}`);
    }

    switch (templateType) {
      case 'symptom-analysis':
        return SYMPTOM_ANALYSIS_TEMPLATE;
      case 'template-finding':
        return TEMPLATE_FINDING_TEMPLATE;
      default:
        return providerTemplate;
    }
  }

  /**
   * Analyzes symptoms using an LLM provider.
   * 
   * @param symptoms - Array of symptom data to analyze
   * @param preferredProvider - Optional preferred provider to use
   * @returns The LLM response containing analysis
   */
  public async analyzeSymptoms(
    symptoms: readonly ISymptomData[],
    preferredProvider?: ProviderName,
  ): Promise<ILLMResponse> {
    const startTime = Date.now();
    try {
      const provider: ProviderName = await this.getAvailableProvider(preferredProvider);
      const template: IPromptTemplate = this.getProviderTemplate(provider, 'symptom-analysis');
      const prompt: string = template.template.replace('{{ symptoms }}', JSON.stringify(symptoms));

      const cacheKey: string = `symptom-analysis:${JSON.stringify(symptoms)}`;
      const cachedResponse = await this.cacheService.get(cacheKey, provider);
      if (cachedResponse) {
        return {
          content: cachedResponse.response,
          tokenUsage: cachedResponse.tokenUsage,
          provider,
        };
      }

      const response: ILLMResponse = await withRetry(
        async () => {
          const llmProvider = this.providers.get(provider);
          if (!llmProvider) {
            throw new Error(`Provider ${provider} not found`);
          }
          return await llmProvider.generateResponse(prompt, template.systemPrompt);
        },
        provider,
        this.maxRetries,
      );

      await this.cacheService.set(
        cacheKey,
        provider,
        response.content,
        response.tokenUsage,
      );

      const endTime = Date.now();
      this.metricsService.recordLatency('llm', 'analyze_symptoms', endTime - startTime);

      return response;
    } catch (error) {
      const provider = preferredProvider || this.defaultProvider;
      this.metricsService.logError('llm', 'analysis_error');
      this.metricsService.incrementProviderError(provider);
      throw error;
    }
  }

  /**
   * Finds a template for symptoms using an LLM provider.
   * 
   * @param symptoms - Array of symptom data to find template for
   * @param preferredProvider - Optional preferred provider to use
   * @returns The LLM response containing template
   */
  public async findTemplate(
    symptoms: readonly ISymptomData[],
    preferredProvider?: ProviderName,
  ): Promise<ILLMResponse> {
    const startTime = Date.now();
    try {
      const provider: ProviderName = await this.getAvailableProvider(preferredProvider);
      const template: IPromptTemplate = this.getProviderTemplate(provider, 'template-finding');
      const prompt: string = template.template.replace('{{ symptoms }}', JSON.stringify(symptoms));

      const cacheKey: string = `template-finding:${JSON.stringify(symptoms)}`;
      const cachedResponse = await this.cacheService.get(cacheKey, provider);
      if (cachedResponse) {
        return {
          content: cachedResponse.response,
          tokenUsage: cachedResponse.tokenUsage,
          provider,
        };
      }

      const response: ILLMResponse = await withRetry(
        async () => {
          const llmProvider = this.providers.get(provider);
          if (!llmProvider) {
            throw new Error(`Provider ${provider} not found`);
          }
          return await llmProvider.generateResponse(prompt, template.systemPrompt);
        },
        provider,
        this.maxRetries,
      );

      await this.cacheService.set(
        cacheKey,
        provider,
        response.content,
        response.tokenUsage,
      );

      const endTime = Date.now();
      this.metricsService.recordLatency('llm', 'find_template', endTime - startTime);

      return response;
    } catch (error) {
      const provider = preferredProvider || this.defaultProvider;
      this.metricsService.logError('llm', 'template_error');
      this.metricsService.incrementProviderError(provider);
      throw error;
    }
  }

  /**
   * Generates a response using an LLM provider.
   * 
   * @param prompt - The prompt to send to the provider
   * @param systemPrompt - Optional system prompt to use
   * @param preferredProvider - Optional preferred provider to use
   * @returns The LLM response
   */
  public async generateResponse(
    prompt: string,
    systemPrompt?: string,
    preferredProvider?: ProviderName,
  ): Promise<ILLMResponse> {
    const provider: ProviderName = await this.getAvailableProvider(preferredProvider);

    const cacheKey: string = `general:${prompt}`;
    const cachedResponse = await this.cacheService.get(cacheKey, provider);
    if (cachedResponse) {
      return {
        content: cachedResponse.response,
        tokenUsage: cachedResponse.tokenUsage,
        provider,
      };
    }

    const response: ILLMResponse = await withRetry(
      async () => {
        const llmProvider = this.providers.get(provider);
        if (!llmProvider) {
          throw new Error(`Provider ${provider} not found`);
        }
        return await llmProvider.generateResponse(prompt, systemPrompt);
      },
      provider,
      this.maxRetries,
    );

    await this.cacheService.set(
      cacheKey,
      provider,
      response.content,
      response.tokenUsage,
    );

    return response;
  }

  /**
   * Clears the LLM response cache.
   */
  public async clearCache(): Promise<void> {
    await this.cacheService.clear();
  }

  /**
   * Gets statistics about the LLM response cache.
   * 
   * @returns Cache statistics
   */
  public async getCacheStats(): Promise<ICacheStats> {
    return await this.cacheService.getStats();
  }

  /**
   * Cleans up old entries from the LLM response cache.
   * 
   * @param maxAgeHours - Maximum age of cache entries in hours
   * @returns Number of entries removed
   */
  public async cleanupCache(maxAgeHours: number = 24): Promise<number> {
    return await this.cacheService.cleanup(maxAgeHours * 60 * 60 * 1000);
  }
}
