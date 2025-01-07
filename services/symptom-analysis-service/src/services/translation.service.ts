import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class TranslationService {
  private readonly openai: OpenAI;
  private readonly systemPrompt = `You are a medical translation expert. 
Your task is to translate medical content while maintaining accuracy and medical terminology.
Please ensure that:
1. Medical terms are translated to their correct technical equivalents
2. Symptom descriptions maintain their clinical precision
3. Instructions and recommendations are clear and unambiguous
4. Cultural context is considered where relevant
5. Units of measurement are appropriately converted if needed`;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY')
    });
  }

  async translateContent(
    content: string,
    targetLanguage: string,
    context: string = 'medical'
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: this.systemPrompt
          },
          {
            role: 'user',
            content: `Please translate the following ${context} content to ${targetLanguage}:
            
${content}

Please maintain medical accuracy and use appropriate medical terminology in ${targetLanguage}.`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      return response.choices[0]?.message?.content || content;
    } catch (error) {
      console.error('Translation error:', error);
      return content; // Return original content if translation fails
    }
  }

  async translateBatch(
    contents: string[],
    targetLanguage: string,
    context: string = 'medical'
  ): Promise<string[]> {
    try {
      const translations = await Promise.all(
        contents.map(content =>
          this.translateContent(content, targetLanguage, context)
        )
      );
      return translations;
    } catch (error) {
      console.error('Batch translation error:', error);
      return contents; // Return original contents if translation fails
    }
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a language detection expert. Please identify the language of the provided text and respond with only the ISO 639-1 language code (e.g., "en" for English, "es" for Spanish).'
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0,
        max_tokens: 10
      });

      return response.choices[0]?.message?.content?.trim().toLowerCase() || 'en';
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en'; // Default to English if detection fails
    }
  }

  async validateTranslation(
    originalText: string,
    translatedText: string,
    targetLanguage: string
  ): Promise<boolean> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a medical translation validator. Please verify that the translation maintains medical accuracy and terminology. Respond with "true" if the translation is accurate, or "false" if there are significant issues.'
          },
          {
            role: 'user',
            content: `Original (${await this.detectLanguage(originalText)}): ${originalText}
Translated (${targetLanguage}): ${translatedText}

Is this translation accurate and maintaining medical terminology?`
          }
        ],
        temperature: 0,
        max_tokens: 10
      });

      const validation = response.choices[0]?.message?.content?.trim().toLowerCase();
      return validation === 'true';
    } catch (error) {
      console.error('Translation validation error:', error);
      return false;
    }
  }
} 