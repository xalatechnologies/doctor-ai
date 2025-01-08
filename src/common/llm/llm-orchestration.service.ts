import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from '../metrics/metrics.service';
import { OpenAIProvider } from './providers/openai.provider';
import { AzureOpenAIProvider } from './providers/azure-openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GooglePalmProvider } from './providers/google-palm.provider';
import { GoogleGeminiProvider } from './providers/google-gemini.provider';
import { DeepseekProvider } from './providers/deepseek.provider';
import { RateLimiterService } from './rate-limiter.service';

export interface LLMAnalysisInput {
  text: string;
  context: string;
  maxTokens?: number;
  temperature?: number;
  provider?: string;
}

export interface LLMAnalysisResult {
  differentials?: string[];
  immediateActions?: string[];
  followUp?: string[];
  risks?: string[];
  isUrgent?: boolean;
  confidence?: number;
  primaryDiagnosis?: string;
  analysis?: string;
  vitalSignsSummary?: string;
  abnormalFindings?: string[];
}

@Injectable()
export class LLMOrchestrationService {
  private readonly logger = new Logger(LLMOrchestrationService.name);
  private readonly providers: Map<string, any> = new Map();
  private readonly defaultProvider: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
    private readonly openaiProvider: OpenAIProvider,
    private readonly azureProvider: AzureOpenAIProvider,
    private readonly anthropicProvider: AnthropicProvider,
    private readonly palmProvider: GooglePalmProvider,
    private readonly geminiProvider: GoogleGeminiProvider,
    private readonly deepseekProvider: DeepseekProvider,
    private readonly rateLimiter: RateLimiterService,
  ) {
    this.defaultProvider = this.configService.get<string>('LLM_DEFAULT_PROVIDER', 'openai');
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize OpenAI provider
    if (this.configService.get('OPENAI_API_KEY')) {
      this.providers.set('openai', this.openaiProvider);
    }

    // Initialize Azure OpenAI provider
    if (this.configService.get('AZURE_OPENAI_API_KEY')) {
      this.providers.set('azure', this.azureProvider);
    }

    // Initialize Anthropic provider
    if (this.configService.get('ANTHROPIC_API_KEY')) {
      this.providers.set('anthropic', this.anthropicProvider);
    }

    // Initialize Google Med-PaLM 2 provider
    if (this.configService.get('GOOGLE_PROJECT_ID')) {
      this.providers.set('palm', this.palmProvider);
    }

    // Initialize Google Gemini provider
    if (this.configService.get('GOOGLE_GEMINI_API_KEY')) {
      this.providers.set('gemini', this.geminiProvider);
    }

    // Initialize Deepseek provider
    if (this.configService.get('DEEPSEEK_API_KEY')) {
      this.providers.set('deepseek', this.deepseekProvider);
    }
  }

  async analyzeText(input: LLMAnalysisInput): Promise<LLMAnalysisResult> {
    const startTime = Date.now();
    const provider = input.provider || this.defaultProvider;

    try {
      const llmProvider = this.providers.get(provider);
      if (!llmProvider) {
        throw new Error(`Provider ${provider} not configured`);
      }

      // Check rate limits before making the request
      await this.rateLimiter.waitForCapacity(provider);

      this.metricsService.incrementLLMRequest(provider, 'default');

      const result = await llmProvider.analyze(input);

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.observeLLMDuration(provider, 'default', duration);
      this.metricsService.logProviderSuccess(provider);

      return result;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.observeLLMDuration(provider, 'default', duration);
      this.metricsService.logProviderFailure(provider);
      this.metricsService.incrementLLMError(provider, 'default', error.name);

      this.logger.error(`Error analyzing text with ${provider}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getProviderHealth(provider: string): Promise<boolean> {
    return this.providers.has(provider);
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  getProviderUsage(provider: string): { current: number; max: number; interval: number } | null {
    return this.rateLimiter.getCurrentUsage(provider);
  }
} 