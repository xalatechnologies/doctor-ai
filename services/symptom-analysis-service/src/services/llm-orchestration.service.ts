import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMConfig, LLMsConfig, defaultLLMConfig } from '../config/llm.config';
import { MedicalTerminology } from '../interfaces/medical-terminology.interface';
import { MetricsService } from './metrics.service';
import { TranslationService } from './translation.service';
import { medicalPrompts } from '../config/medical-prompts.config';

export type LLMProvider = keyof LLMsConfig;

interface AnalysisResult {
  summary: string;
  confidence: number;
  provider?: LLMProvider;
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

interface LLMResponse {
  content: string;
  confidence: number;
  provider: LLMProvider;
  latency: number;
}

interface LLMInstance {
  client: any;
  config: LLMConfig;
  handler: (prompt: string) => Promise<string>;
}

@Injectable()
export class LLMOrchestrationService implements OnModuleInit {
  private llmInstances: Map<LLMProvider, LLMInstance> = new Map();
  private config: LLMsConfig;
  private medicalTerminology: MedicalTerminology;

  constructor(
    private configService: ConfigService,
    private translationService: TranslationService,
    private metricsService: MetricsService
  ) {
    const config = this.configService.get<LLMsConfig>('llms');
    this.config = config || defaultLLMConfig;
    
    // Validate configuration
    if (!this.config) {
      throw new Error('LLM configuration is required');
    }
  }

  async onModuleInit() {
    try {
      // Initialize enabled LLM providers
      await this.initializeLLMClients();

      // Validate that at least one provider is enabled and initialized
      if (this.llmInstances.size === 0) {
        throw new Error('No LLM providers were successfully initialized');
      }
    } catch (error) {
      console.error('Failed to initialize LLM providers:', error);
      throw error;
    }
  }

  private async initializeLLMClients(): Promise<void> {
    // Initialize OpenAI if enabled
    if (this.config.openai?.enabled) {
      const openai = new OpenAI({ apiKey: this.config.openai.apiKey });
      this.llmInstances.set('openai', {
        client: openai,
        config: this.config.openai,
        handler: async (prompt: string): Promise<string> => {
          const response = await openai.chat.completions.create({
            model: this.config.openai.model,
            messages: [
              {
                role: "system",
                content: "You are a medical analysis assistant. Provide detailed, evidence-based analysis."
              },
              { role: "user", content: prompt }
            ],
            temperature: this.config.openai.temperature,
            max_tokens: this.config.openai.maxTokens
          });
          return response.choices[0].message.content || '';
        }
      });
    }

    // Initialize other providers...
  }

  async analyzeText(params: {
    text: string;
    context: string;
    provider?: LLMProvider;
  }): Promise<AnalysisResult> {
    const { text, context, provider } = params;

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
      : Array.from(this.llmInstances.keys());

    const responses = await Promise.all(
      providers.map(provider => this.getLLMResponse(text, context, provider))
    );

    return responses.filter(response => response !== null);
  }

  private async getLLMResponse(
    text: string,
    context: string,
    provider: LLMProvider
  ): Promise<LLMResponse | null> {
    const instance = this.llmInstances.get(provider);
    if (!instance) {
      throw new Error(`Provider ${provider} not initialized`);
    }

    const startTime = Date.now();
    try {
      const content = await Promise.race([
        instance.handler(`Context: ${context}\n\n${text}`),
        new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), instance.config.timeout)
        )
      ]);

      const processedContent = typeof content === 'string' ? content : String(content);
      const response: LLMResponse = {
        content: processedContent,
        confidence: 0,
        provider,
        latency: Date.now() - startTime
      };
      
      response.confidence = this.calculateConfidence(response);
      return response;
    } catch (error) {
      console.error(`Error with ${provider}:`, error);
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

  private calculateConfidence(response: LLMResponse): number {
    // Implement confidence calculation based on:
    // 1. Response completeness
    // 2. Medical terminology usage
    // 3. Consistency with known medical knowledge
    // 4. Presence of supporting evidence
    let confidence = 0.5; // Base confidence

    // Check for medical terminology
    const medicalTerms = this.medicalTerminology.extractTerms(response.content);
    confidence += Math.min(0.2, medicalTerms.size * 0.02);

    // Check for structured format
    if (response.content.includes('Assessment:')) confidence += 0.1;
    if (response.content.includes('Plan:')) confidence += 0.1;
    if (response.content.includes('Differential:')) confidence += 0.1;

    // Check for evidence citation
    if (response.content.includes('based on') || response.content.includes('evidence suggests')) {
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