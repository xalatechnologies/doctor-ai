import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class TranslationService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY')
    });
  }

  async translate(content: string, targetLanguage: string): Promise<string> {
    if (targetLanguage === 'en') {
      return content;
    }

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a medical translator. Translate the following medical content to ${targetLanguage}. 
                   Maintain medical accuracy and use appropriate medical terminology in the target language.`
        },
        { role: "user", content }
      ],
      temperature: 0.3
    });

    return response.choices[0].message.content || content;
  }
} 