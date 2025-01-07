import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { LLMConfig } from '../config/llm.config';
import { MedicalPrompts } from '../config/medical-prompts.config';
import { MetricsService } from './metrics.service';
import { MedicalTerminology } from '../interfaces/medical-terminology.interface';

export type LLMProvider = 'openai' | 'anthropic' | 'deepseek' | 'cohere';

interface LLMResponse {
  content: string;
  confidence: number;
  provider: LLMProvider;
  latency: number;
}

interface AnalysisResult {
  summary: string;
  confidence: number;
  primaryDiagnosis?: string;
  evidence?: string[];
  differentials?: string[];
  immediateActions?: string[];
  medications?: string[];
  investigations?: string[];
  referrals?: string[];
  followUp?: string[];
  riskFactors?: string[];
}

@Injectable()
export class LLMOrchestrationService implements OnModuleInit {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private enabledProviders: Set<LLMProvider> = new Set();
  private readonly defaultProvider: LLMProvider = 'openai';

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
    private readonly medicalTerminology: MedicalTerminology
  ) {}

  async onModuleInit() {
    await this.initializeLLMClients();
    this.validateConfiguration();
  }

  private async initializeLLMClients(): Promise<void> {
    // Initialize OpenAI if configured
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (openaiApiKey) {
      this.openai = new OpenAI({ apiKey: openaiApiKey });
      this.enabledProviders.add('openai');
    }

    // Initialize Anthropic if configured
    const anthropicApiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (anthropicApiKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicApiKey });
      this.enabledProviders.add('anthropic');
    }

    // Add initialization for other providers here
  }

  private validateConfiguration(): void {
    if (this.enabledProviders.size === 0) {
      throw new Error('No LLM providers are configured');
    }
  }

  async analyzeText(params: {
    text: string;
    context: string;
    provider?: LLMProvider;
  }): Promise<AnalysisResult> {
    const { text, context, provider = this.defaultProvider } = params;

    try {
      // Get responses from enabled providers
      const responses = await this.getResponses(text, context, provider);

      // Analyze and combine responses
      const analysis = await this.analyzeResponses(responses);

      // Select the best response based on confidence and provider metrics
      const result = this.selectBestResponse(analysis);

      return result;
    } catch (error) {
      this.metricsService.logError('llm_analysis', error);
      throw error;
    }
  }

  private async getResponses(
    text: string,
    context: string,
    preferredProvider?: LLMProvider
  ): Promise<LLMResponse[]> {
    const providers = preferredProvider
      ? [preferredProvider]
      : Array.from(this.enabledProviders);

    const responses = await Promise.all(
      providers.map(provider => this.getLLMResponse(provider, text, context))
    );

    return responses.filter(response => response !== null);
  }

  private async getLLMResponse(
    provider: LLMProvider,
    text: string,
    context: string
  ): Promise<LLMResponse> {
    const startTime = Date.now();
    try {
      let content: string;
      let confidence: number;

      switch (provider) {
        case 'openai':
          const openaiResponse = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: MedicalPrompts[provider].systemPrompt
              },
              {
                role: 'user',
                content: `Context: ${context}\n\n${text}`
              }
            ],
            temperature: 0.3
          });
          content = openaiResponse.choices[0]?.message?.content || '';
          confidence = this.calculateConfidence(content);
          break;

        case 'anthropic':
          const anthropicResponse = await this.anthropic.messages.create({
            model: 'claude-2',
            max_tokens: 1000,
            messages: [
              {
                role: 'system',
                content: MedicalPrompts[provider].systemPrompt
              },
              {
                role: 'user',
                content: `Context: ${context}\n\n${text}`
              }
            ]
          });
          content = anthropicResponse.content[0]?.text || '';
          confidence = this.calculateConfidence(content);
          break;

        // Add cases for other providers

        default:
          throw new Error(`Unsupported LLM provider: ${provider}`);
      }

      const latency = Date.now() - startTime;
      this.metricsService.logLatency(`llm_${provider}`, latency, true);

      return {
        content,
        confidence,
        provider,
        latency
      };
    } catch (error) {
      this.metricsService.logError(`llm_${provider}`, error);
      await this.metricsService.logProviderFailure(provider);
      return null;
    }
  }

  private async analyzeResponses(responses: LLMResponse[]): Promise<AnalysisResult[]> {
    return responses.map(response => {
      try {
        const parsed = JSON.parse(response.content);
        return {
          ...parsed,
          confidence: response.confidence,
          provider: response.provider
        };
      } catch (error) {
        // If response is not JSON, try to extract information using regex
        return this.extractAnalysisFromText(response.content, response.confidence);
      }
    });
  }

  private selectBestResponse(analyses: AnalysisResult[]): AnalysisResult {
    if (analyses.length === 0) {
      throw new Error('No valid responses from LLM providers');
    }

    // Sort by confidence and provider metrics
    const sorted = analyses.sort((a, b) => {
      const confidenceDiff = b.confidence - a.confidence;
      if (Math.abs(confidenceDiff) > 0.1) {
        return confidenceDiff;
      }
      // If confidence is similar, use provider metrics
      const aMetrics = this.metricsService.getProviderMetrics(a.provider as LLMProvider);
      const bMetrics = this.metricsService.getProviderMetrics(b.provider as LLMProvider);
      return (bMetrics?.successRate || 0) - (aMetrics?.successRate || 0);
    });

    return sorted[0];
  }

  private calculateConfidence(content: string): number {
    // Implement confidence calculation based on:
    // 1. Response completeness
    // 2. Medical terminology usage
    // 3. Consistency with known medical knowledge
    // 4. Presence of supporting evidence
    let confidence = 0.5; // Base confidence

    // Check for medical terminology
    const medicalTerms = this.medicalTerminology.extractTerms(content);
    confidence += Math.min(0.2, medicalTerms.length * 0.02);

    // Check for structured format
    if (content.includes('Assessment:')) confidence += 0.1;
    if (content.includes('Plan:')) confidence += 0.1;
    if (content.includes('Differential:')) confidence += 0.1;

    // Check for evidence citation
    if (content.includes('based on') || content.includes('evidence suggests')) {
      confidence += 0.1;
    }

    // Cap confidence at 1.0
    return Math.min(1.0, confidence);
  }

  private extractAnalysisFromText(text: string, confidence: number): AnalysisResult {
    const summary = text.slice(0, 200); // First 200 characters as summary
    const result: AnalysisResult = {
      summary,
      confidence
    };

    // Extract primary diagnosis
    const diagnosisMatch = text.match(/(?:diagnosis|impression):\s*([^\n.]+)/i);
    if (diagnosisMatch) {
      result.primaryDiagnosis = diagnosisMatch[1].trim();
    }

    // Extract evidence
    const evidenceMatch = text.match(/evidence:\s*([^\n]+)/i);
    if (evidenceMatch) {
      result.evidence = evidenceMatch[1]
        .split(',')
        .map(e => e.trim())
        .filter(Boolean);
    }

    // Extract actions
    const actionsMatch = text.match(/(?:actions|plan):\s*([^\n]+)/i);
    if (actionsMatch) {
      result.immediateActions = actionsMatch[1]
        .split(',')
        .map(a => a.trim())
        .filter(Boolean);
    }

    return result;
  }
} 