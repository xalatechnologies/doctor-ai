import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMConfig, LLMsConfig, defaultLLMConfig } from '../config/llm.config';
import { MedicalTerminology } from '../utils/medical-terminology';
import { MetricsService } from './metrics.service';
import { TranslationService } from './translation.service';
import { medicalPrompts } from '../config/medical-prompts.config';

export type LLMProvider = keyof LLMsConfig;

interface LLMInstance {
  client: any;
  config: any;
  handler: (prompt: string) => Promise<string>;
}

interface MedicalError {
  type: 'terminology' | 'diagnosis' | 'recommendation' | 'urgency' | 'guideline';
  severity: 'low' | 'medium' | 'high';
  message: string;
  context?: any;
}

interface LLMResponse {
  content: string;
  confidence: number;
  provider: LLMProvider;
  latency: number;
}

@Injectable()
export class LLMOrchestrationService implements OnModuleInit {
  private llmInstances: Map<LLMProvider, LLMInstance> = new Map();
  private config: LLMsConfig;

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
      await this.initializeLLMClients();
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
        handler: async (prompt: string) => {
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
          return response.choices[0].message.content;
        }
      });
    }

    // Initialize Anthropic if enabled
    if (this.config.anthropic?.enabled) {
      const anthropic = new Anthropic({ apiKey: this.config.anthropic.apiKey });
      this.llmInstances.set('anthropic', {
        client: anthropic,
        config: this.config.anthropic,
        handler: async (prompt: string) => {
          const response = await anthropic.messages.create({
            model: this.config.anthropic.model,
            max_tokens: this.config.anthropic.maxTokens,
            messages: [{ role: "user", content: prompt }],
            system: "You are a medical analysis assistant. Provide detailed, evidence-based analysis."
          });
          return response.content[0].text as string;
        }
      });
    }

    // Initialize other providers similarly...
  }

  private async getLLMResponse(
    prompt: string,
    provider: LLMProvider
  ): Promise<LLMResponse> {
    const instance = this.llmInstances.get(provider);
    if (!instance) {
      throw new Error(`Provider ${provider} not initialized`);
    }

    const startTime = Date.now();
    try {
      const content = await Promise.race([
        instance.handler(prompt),
        new Promise((_, reject) => 
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
    return {
        content: '',
        confidence: 0,
        provider,
        latency: Date.now() - startTime
      };
    }
  }

  private analyzeResponses(responses: LLMResponse[]): LLMResponse[] {
    return responses.map(response => ({
      ...response,
      confidence: this.calculateAgreementScore(response, responses)
    }));
  }

  private selectBestResponse(responses: LLMResponse[]): LLMResponse {
    return responses.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
  }

  private calculateConfidence(response: LLMResponse): number {
    const weights = {
      terminology: 0.3,
      structure: 0.2,
      recommendations: 0.2,
      urgency: 0.15,
      guidelines: 0.15
    };

    return (
      this.assessTerminologyConfidence(response.content) * weights.terminology +
      this.assessStructureConfidence(response.content) * weights.structure +
      this.assessRecommendationConfidence(response.content) * weights.recommendations +
      this.assessUrgencyConfidence(response.content) * weights.urgency +
      this.assessGuidelineConfidence(response.content) * weights.guidelines
    );
  }

  private assessTerminologyConfidence(content: string): number {
    const terms = MedicalTerminology.extractTerms(content);
    const specificTerms = new Set([...terms].filter(term => 
      /^[a-z]+(?:itis|emia|oma|osis|pathy|plasty|ectomy|otomy)$/i.test(term)
    ));
    return Math.min(specificTerms.size / 3, 1);
  }

  private assessStructureConfidence(content: string): number {
    const structure = this.extractStructure(content);
    const requiredSections = ['assessment', 'diagnosis', 'differential', 'recommendations'];
    const coverage = requiredSections.filter(section => 
      structure.some(s => s.includes(section))
    ).length;
    return coverage / requiredSections.length;
  }

  private assessRecommendationConfidence(content: string): number {
    const recommendations = this.extractRecommendations(content);
    return Math.min(recommendations.length / 3, 1);
  }

  private assessUrgencyConfidence(content: string): number {
    const hasUrgencyLevel = /urgency:.*?(low|moderate|high|emergency)/i.test(content);
    const hasTimeframe = /within \d+ (minutes?|hours?|days?)/i.test(content);
    return hasUrgencyLevel && hasTimeframe ? 1 : 0.5;
  }

  private assessGuidelineConfidence(content: string): number {
    // Simplified implementation
    return content.toLowerCase().includes('guideline') ? 1 : 0.5;
  }

  private extractStructure(content: string): string[] {
    return content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => this.getLineType(line));
  }

  private getLineType(line: string): string {
    if (line.match(/^(diagnosis|assessment):/i)) return 'diagnosis';
    if (line.match(/^(recommendation|treatment):/i)) return 'recommendation';
    if (line.match(/^(urgency|severity):/i)) return 'severity';
    if (line.match(/^(followup|follow-up):/i)) return 'followup';
    return 'other';
  }

  private extractRecommendations(content: string): string[] {
    const recommendations: string[] = [];
    let inRecommendationsSection = false;

    content.split('\n').forEach(line => {
      if (line.match(/^recommendations?:/i)) {
        inRecommendationsSection = true;
      } else if (inRecommendationsSection && line.trim()) {
        if (line.match(/^(diagnosis|assessment|urgency|followup):/i)) {
          inRecommendationsSection = false;
        } else {
          recommendations.push(line.trim());
        }
      }
    });

    return recommendations;
  }

  private calculateAgreementScore(
    response: LLMResponse,
    allResponses: LLMResponse[]
  ): number {
    if (!response.content || allResponses.length <= 1) return 0;

    const scores = {
      medicalTerms: this.compareMedicalTerminology(response, allResponses),
      structuralSimilarity: this.compareStructure(response, allResponses),
      severityConsistency: this.compareSeverity(response, allResponses),
      recommendationAlignment: this.compareRecommendations(response, allResponses)
    };

    return (
      scores.medicalTerms * 0.35 +
      scores.structuralSimilarity * 0.15 +
      scores.severityConsistency * 0.25 +
      scores.recommendationAlignment * 0.25
    );
  }

  private compareMedicalTerminology(response: LLMResponse, allResponses: LLMResponse[]): number {
    const terms = MedicalTerminology.extractTerms(response.content);
    let totalAgreement = 0;

    allResponses.forEach(other => {
      if (other === response) return;
      const otherTerms = MedicalTerminology.extractTerms(other.content);
      const agreement = this.calculateTermOverlap(terms, otherTerms);
      totalAgreement += agreement;
    });

    return totalAgreement / (allResponses.length - 1);
  }

  private calculateTermOverlap(terms1: Set<string>, terms2: Set<string>): number {
    const intersection = new Set([...terms1].filter(term => terms2.has(term)));
    const union = new Set([...terms1, ...terms2]);
    return intersection.size / union.size;
  }

  private compareStructure(response: LLMResponse, allResponses: LLMResponse[]): number {
    const structure = this.extractStructure(response.content);
    let totalSimilarity = 0;

    allResponses.forEach(other => {
      if (other === response) return;
      const otherStructure = this.extractStructure(other.content);
      totalSimilarity += this.calculateStructureSimilarity(structure, otherStructure);
    });

    return totalSimilarity / (allResponses.length - 1);
  }

  private calculateStructureSimilarity(structure1: string[], structure2: string[]): number {
    const intersection = structure1.filter(type => structure2.includes(type));
    const union = new Set([...structure1, ...structure2]);
    return intersection.length / union.size;
  }

  private compareSeverity(response: LLMResponse, allResponses: LLMResponse[]): number {
    const severity = this.extractSeverityLevel(response.content);
    let totalAgreement = 0;

    allResponses.forEach(other => {
      if (other === response) return;
      const otherSeverity = this.extractSeverityLevel(other.content);
      totalAgreement += 1 - Math.abs(severity - otherSeverity) / 4;
    });

    return totalAgreement / (allResponses.length - 1);
  }

  private extractSeverityLevel(content: string): number {
    const severityMatch = content.match(/severity:?\s*(\d+)/i);
    if (severityMatch) {
      return Math.min(Math.max(parseInt(severityMatch[1], 10), 1), 4);
    }
    return 2; // Default moderate severity
  }

  private compareRecommendations(response: LLMResponse, allResponses: LLMResponse[]): number {
    const recommendations = this.extractRecommendations(response.content);
    let totalAlignment = 0;

    allResponses.forEach(other => {
      if (other === response) return;
      const otherRecommendations = this.extractRecommendations(other.content);
      totalAlignment += this.calculateRecommendationAlignment(recommendations, otherRecommendations);
    });

    return totalAlignment / (allResponses.length - 1);
  }

  private calculateRecommendationAlignment(recs1: string[], recs2: string[]): number {
    const normalizedRecs1 = recs1.map(r => this.normalizeRecommendation(r));
    const normalizedRecs2 = recs2.map(r => this.normalizeRecommendation(r));

    let matches = 0;
    normalizedRecs1.forEach(rec1 => {
      if (normalizedRecs2.some(rec2 => this.calculateStringSimilarity(rec1, rec2) > 0.7)) {
        matches++;
      }
    });

    return matches / Math.max(normalizedRecs1.length, normalizedRecs2.length);
  }

  private normalizeRecommendation(rec: string): string {
    return rec.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    return (longer.length - this.levenshteinDistance(longer, shorter)) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str1.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str1.length; i++) {
      for (let j = 1; j <= str2.length; j++) {
        if (str1[i-1] === str2[j-1]) {
          matrix[i][j] = matrix[i-1][j-1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i-1][j-1] + 1,
            matrix[i][j-1] + 1,
            matrix[i-1][j] + 1
          );
        }
      }
    }

    return matrix[str1.length][str2.length];
  } 
} 