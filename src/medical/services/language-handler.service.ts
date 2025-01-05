import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

interface LanguageConfig {
  code: string;
  name: string;
  medicalTerminology: boolean;
  rtl: boolean;
}

@Injectable()
export class LanguageHandlerService {
  private openai: OpenAI;
  private readonly supportedLanguages: Map<string, LanguageConfig> = new Map([
    ['en', { code: 'en', name: 'English', medicalTerminology: true, rtl: false }],
    ['es', { code: 'es', name: 'Spanish', medicalTerminology: true, rtl: false }],
    ['ar', { code: 'ar', name: 'Arabic', medicalTerminology: true, rtl: true }],
    ['zh', { code: 'zh', name: 'Chinese', medicalTerminology: true, rtl: false }],
    // Add more languages as needed
  ]);

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY')
    });
  }

  async localizeResponse(
    content: string,
    targetLanguage: string,
    context: {
      medicalTerminology: boolean;
      culturalContext?: string;
      formalityLevel?: 'formal' | 'informal';
    }
  ): Promise<string> {
    const langConfig = this.supportedLanguages.get(targetLanguage);
    if (!langConfig) {
      throw new Error(`Unsupported language: ${targetLanguage}`);
    }

    const prompt = this.buildLocalizationPrompt(content, langConfig, context);
    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a medical translation expert. Maintain medical accuracy while adapting to cultural context."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3
    });

    return response.choices[0].message.content;
  }

  private buildLocalizationPrompt(
    content: string,
    langConfig: LanguageConfig,
    context: any
  ): string {
    return `
      Translate and localize the following medical content to ${langConfig.name}.
      
      Context:
      - Use ${context.medicalTerminology ? 'professional' : 'simplified'} medical terminology
      - Cultural context: ${context.culturalContext || 'neutral'}
      - Formality level: ${context.formalityLevel || 'formal'}
      
      Original content:
      ${content}
      
      Requirements:
      1. Maintain medical accuracy
      2. Use culturally appropriate expressions
      3. Preserve severity levels and urgency indicators
      4. Adapt measurements and units if necessary
      5. Keep formatting and structure
    `;
  }
} 