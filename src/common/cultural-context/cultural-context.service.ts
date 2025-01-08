import { Injectable } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';

export interface RegionalMedicalUnits {
  weight: string;
  height: string;
  temperature: string;
}

export interface RegionalNumberFormat {
  decimal: string;
  thousands: string;
}

export interface CulturalSensitivity {
  category: string;
  considerations: string[];
}

export interface CulturalContext {
  language: string;
  region: string;
  preferences?: Record<string, any>;
}

@Injectable()
export class CulturalContextService {
  constructor(private readonly cacheService: CacheService) {}

  async setLanguagePreference(userId: string, language: string): Promise<void> {
    if (!this.isValidLanguageCode(language)) {
      throw new Error(`Invalid language code: ${language}`);
    }
    await this.cacheService.set(`lang:${userId}`, language);
  }

  async getLanguagePreference(userId: string): Promise<string> {
    return (await this.cacheService.get(`lang:${userId}`)) || 'en';
  }

  async setCulturalSetting(
    userId: string,
    setting: string,
    value: string,
  ): Promise<void> {
    await this.cacheService.set(`cultural:${userId}:${setting}`, value);
  }

  async getCulturalSetting(
    userId: string,
    setting: string,
  ): Promise<string | null> {
    return await this.cacheService.get(`cultural:${userId}:${setting}`);
  }

  async getLocalizedText(
    key: string,
    language: string,
    params?: Record<string, any>,
  ): Promise<string> {
    if (!this.isValidLanguageCode(language)) {
      throw new Error(`Invalid language code: ${language}`);
    }
    // Implementation would load from translation files/service
    // Apply params to the translation if provided
    let text = key;
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{${param}}`, String(value));
      });
    }
    return text;
  }

  async getRegionalMedicalUnits(region: string): Promise<RegionalMedicalUnits> {
    this.validateRegionCode(region);
    return {
      weight: region === 'US' ? 'lb' : 'kg',
      height: region === 'US' ? 'ft' : 'm',
      temperature: region === 'US' ? 'F' : 'C',
    };
  }

  async getRegionalDateFormat(region: string): Promise<string> {
    this.validateRegionCode(region);
    const formats: Record<string, string> = {
      US: 'MM/DD/YYYY',
      GB: 'DD/MM/YYYY',
      DE: 'DD.MM.YYYY',
    };
    return formats[region] || 'YYYY-MM-DD';
  }

  async getRegionalNumberFormat(region: string): Promise<RegionalNumberFormat> {
    this.validateRegionCode(region);
    const formats: Record<string, RegionalNumberFormat> = {
      US: { decimal: '.', thousands: ',' },
      DE: { decimal: ',', thousands: '.' },
    };
    return formats[region] || { decimal: '.', thousands: ',' };
  }

  async getCulturalGreeting(region: string, time: Date): Promise<string> {
    this.validateRegionCode(region);
    // Implementation would load from cultural data service
    // Use time to determine appropriate greeting (morning/afternoon/evening)
    const hour = time.getHours();
    if (hour < 12) {
      return 'Good morning';
    } else if (hour < 18) {
      return 'Good afternoon';
    } else {
      return 'Good evening';
    }
  }

  async getCulturalMedicalTerm(term: string, region: string): Promise<string> {
    this.validateRegionCode(region);
    // Implementation would load from medical terminology service
    return term;
  }

  async getCulturalSensitivities(
    region: string,
  ): Promise<CulturalSensitivity[]> {
    this.validateRegionCode(region);
    if (region === 'XX') {
      throw new Error('No cultural data available for region');
    }
    return [
      {
        category: 'general',
        considerations: ['example consideration'],
      },
    ];
  }

  async getContextForUser(userId: string): Promise<CulturalContext> {
    const language = await this.getLanguagePreference(userId);
    const region = (await this.getCulturalSetting(userId, 'region')) || 'US';
    const preferences = {
      dateFormat: await this.getCulturalSetting(userId, 'dateFormat'),
      timeFormat: await this.getCulturalSetting(userId, 'timeFormat'),
      measurementUnit: await this.getCulturalSetting(userId, 'measurementUnit'),
    };

    return { language, region, preferences };
  }

  async adaptContent(
    content: string,
    context: CulturalContext,
  ): Promise<string> {
    // First, translate the content if needed
    let adaptedContent = await this.getLocalizedText(content, context.language);

    // Then apply any regional adaptations (e.g., date formats, measurements)
    adaptedContent = await this.applyRegionalAdaptations(
      adaptedContent,
      context,
    );

    return adaptedContent;
  }

  private async applyRegionalAdaptations(
    content: string,
    context: CulturalContext,
  ): Promise<string> {
    // Apply regional specific adaptations
    // This is a placeholder implementation
    return content;
  }

  private isValidLanguageCode(language: string): boolean {
    // Implementation would validate against ISO 639-1 language codes
    const validCodes = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'];
    return validCodes.includes(language);
  }

  private validateRegionCode(region: string): void {
    // Implementation would validate against ISO 3166-1 alpha-2 country codes
    const validCodes = ['US', 'GB', 'DE', 'FR', 'IT', 'ES', 'CN', 'JP', 'KR'];
    if (!validCodes.includes(region)) {
      throw new Error(`Invalid region code: ${region}`);
    }
  }
}
