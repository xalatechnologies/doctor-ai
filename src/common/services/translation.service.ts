import { Injectable } from '@nestjs/common';

@Injectable()
export class TranslationService {
  async translate(text: string, targetLocale: string): Promise<string> {
    // Mock implementation for testing
    return text;
  }
} 