import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  LLMAnalysisInput,
  LLMAnalysisResult,
} from '../llm-orchestration.service';
import { MetricsService } from '../../metrics/metrics.service';

@Injectable()
export class AnthropicProvider {
  private readonly anthropic: Anthropic;
  private readonly logger = new Logger(AnthropicProvider.name);
  private readonly defaultModel: string;
  private readonly maxTokens: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    this.anthropic = new Anthropic({ apiKey });
    this.defaultModel = this.configService.get<string>(
      'ANTHROPIC_MODEL',
      'claude-2',
    );
    this.maxTokens = this.configService.get<number>(
      'ANTHROPIC_MAX_TOKENS',
      2000,
    );
  }

  async analyze(input: LLMAnalysisInput): Promise<LLMAnalysisResult> {
    const startTime = Date.now();
    try {
      const prompt = this.buildPrompt(input);
      const response = await this.anthropic.messages.create({
        model: this.defaultModel,
        system: this.getSystemPrompt(input.context),
        messages: [{ role: 'user', content: prompt }],
        max_tokens: input.maxTokens || this.maxTokens,
        temperature: input.temperature || 0.7,
      });

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.observeLLMDuration(
        'anthropic',
        this.defaultModel,
        duration,
      );
      this.metricsService.incrementLLMTokens(
        'anthropic',
        this.defaultModel,
        'prompt',
        prompt.length,
      );
      this.metricsService.incrementLLMTokens(
        'anthropic',
        this.defaultModel,
        'completion',
        response.usage?.output_tokens || 0,
      );

      const content = response.content.reduce((acc, block) => {
        if (block.type === 'text') {
          return acc + block.text;
        }
        return acc;
      }, '');

      return this.parseResponse(content);
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.observeLLMDuration(
        'anthropic',
        this.defaultModel,
        duration,
      );
      this.metricsService.incrementLLMError(
        'anthropic',
        this.defaultModel,
        error.name,
      );
      this.logger.error(
        `Anthropic analysis failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private getSystemPrompt(context: string): string {
    switch (context) {
      case 'possible_conditions':
        return 'You are a medical expert analyzing symptoms to identify possible conditions. Focus on providing accurate differential diagnoses with confidence levels.';
      case 'risk_assessment':
        return 'You are a medical expert assessing the risk level of symptoms. Consider severity, urgency, and potential complications.';
      case 'recommendations':
        return 'You are a medical expert providing recommendations based on symptoms. Focus on immediate actions and follow-up steps.';
      case 'medical_report':
        return 'You are a medical expert generating a comprehensive medical report. Include detailed analysis, findings, and recommendations.';
      default:
        return 'You are a medical expert providing analysis and recommendations based on symptoms.';
    }
  }

  private buildPrompt(input: LLMAnalysisInput): string {
    return `Analyze the following medical information:
${input.text}

Provide a detailed analysis including:
1. Possible conditions and their likelihood
2. Immediate actions needed
3. Follow-up recommendations
4. Risk assessment
5. Whether urgent care is needed

Format the response as JSON with the following structure:
{
  "differentials": ["condition1", "condition2"],
  "immediateActions": ["action1", "action2"],
  "followUp": ["followup1", "followup2"],
  "risks": ["risk1", "risk2"],
  "isUrgent": boolean,
  "confidence": number,
  "primaryDiagnosis": "string",
  "analysis": "string",
  "vitalSignsSummary": "string",
  "abnormalFindings": ["finding1", "finding2"]
}`;
  }

  private parseResponse(response: string): LLMAnalysisResult {
    try {
      return JSON.parse(response);
    } catch (error) {
      this.logger.error(`Failed to parse Anthropic response: ${error.message}`);
      throw new Error('Failed to parse analysis result');
    }
  }
}
