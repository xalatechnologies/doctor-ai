import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VertexAI } from '@google-cloud/vertexai';
import { LLMAnalysisInput, LLMAnalysisResult } from '../llm-orchestration.service';
import { MetricsService } from '../../metrics/metrics.service';
import { HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';

@Injectable()
export class GooglePalmProvider {
  private readonly vertex: VertexAI;
  private readonly logger = new Logger(GooglePalmProvider.name);
  private readonly defaultModel: string;
  private readonly maxTokens: number;
  private readonly project: string;
  private readonly location: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
  ) {
    this.project = this.configService.get<string>('GOOGLE_PROJECT_ID');
    this.location = this.configService.get<string>('GOOGLE_LOCATION', 'us-central1');

    if (!this.project) {
      throw new Error('Google project ID not configured');
    }

    this.vertex = new VertexAI({
      project: this.project,
      location: this.location,
    });

    this.defaultModel = this.configService.get<string>('GOOGLE_PALM_MODEL', 'medpalm2-large');
    this.maxTokens = this.configService.get<number>('GOOGLE_PALM_MAX_TOKENS', 2048);
  }

  async analyze(input: LLMAnalysisInput): Promise<LLMAnalysisResult> {
    const startTime = Date.now();
    try {
      const model = this.vertex.preview.getGenerativeModel({
        model: this.defaultModel,
      });

      const prompt = this.buildPrompt(input);
      const response = await model.generateContent({
        contents: [
          { role: 'system', parts: [{ text: this.getSystemPrompt(input.context) }] },
          { role: 'user', parts: [{ text: prompt }] },
        ],
        generationConfig: {
          maxOutputTokens: input.maxTokens || this.maxTokens,
          temperature: input.temperature || 0.7,
        }
      });

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.observeLLMDuration('palm', this.defaultModel, duration);
      this.metricsService.incrementLLMTokens('palm', this.defaultModel, 'prompt', prompt.length);
      this.metricsService.incrementLLMTokens('palm', this.defaultModel, 'completion', 0);

      const content = response.response.candidates[0]?.content;
      if (!content) {
        throw new Error('No response from Med-PaLM 2');
      }

      return this.parseResponse(content.parts[0].text);
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.observeLLMDuration('palm', this.defaultModel, duration);
      this.metricsService.incrementLLMError('palm', this.defaultModel, error.name);
      this.logger.error(`Med-PaLM 2 analysis failed: ${error.message}`, error.stack);
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
      this.logger.error(`Failed to parse Med-PaLM 2 response: ${error.message}`);
      throw new Error('Failed to parse analysis result');
    }
  }
} 