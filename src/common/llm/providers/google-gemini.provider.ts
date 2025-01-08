import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LLMAnalysisInput,
  LLMAnalysisResult,
} from '../llm-orchestration.service';
import { MetricsService } from '../../metrics/metrics.service';

@Injectable()
export class GoogleGeminiProvider {
  private readonly genAI: GoogleGenerativeAI;
  private readonly logger = new Logger(GoogleGeminiProvider.name);
  private readonly defaultModel: string;
  private readonly maxTokens: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
  ) {
    const apiKey = this.configService.get<string>('GOOGLE_GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('Google Gemini API key not configured');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.defaultModel = this.configService.get<string>(
      'GOOGLE_GEMINI_MODEL',
      'gemini-pro',
    );
    this.maxTokens = this.configService.get<number>(
      'GOOGLE_GEMINI_MAX_TOKENS',
      2048,
    );
  }

  async analyze(input: LLMAnalysisInput): Promise<LLMAnalysisResult> {
    const startTime = Date.now();
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.defaultModel,
      });

      const prompt = this.buildPrompt(input);
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: this.getSystemPrompt(input.context) }],
          },
          { role: 'user', parts: [{ text: prompt }] },
        ],
        generationConfig: {
          maxOutputTokens: input.maxTokens || this.maxTokens,
          temperature: input.temperature || 0.7,
        },
      });

      const response = result.response;
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.observeLLMDuration(
        'gemini',
        this.defaultModel,
        duration,
      );
      this.metricsService.incrementLLMTokens(
        'gemini',
        this.defaultModel,
        'prompt',
        prompt.length,
      );
      this.metricsService.incrementLLMTokens(
        'gemini',
        this.defaultModel,
        'completion',
        0,
      );

      if (!response.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('No response from Gemini');
      }

      return this.parseResponse(response.candidates[0].content.parts[0].text);
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.observeLLMDuration(
        'gemini',
        this.defaultModel,
        duration,
      );
      this.metricsService.incrementLLMError(
        'gemini',
        this.defaultModel,
        error.name,
      );
      this.logger.error(
        `Gemini analysis failed: ${error.message}`,
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
      this.logger.error(`Failed to parse Gemini response: ${error.message}`);
      throw new Error('Failed to parse analysis result');
    }
  }
}
