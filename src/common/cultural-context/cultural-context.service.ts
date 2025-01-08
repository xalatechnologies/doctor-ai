import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { MetricsService } from '../metrics/metrics.service';

export interface CulturalContext {
  language: string;
  region: string;
  preferences: Record<string, string>;
}

export interface CulturalPreference {
  key: string;
  value: string;
  description: string;
}

interface UserPreference {
  user_id: string;
  key: string;
  value: string;
}

@Injectable()
export class CulturalContextService {
  private readonly defaultLanguage: string;
  private readonly defaultRegion: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
    private readonly metricsService: MetricsService,
  ) {
    this.defaultLanguage = this.configService.get<string>('DEFAULT_LANGUAGE', 'en');
    this.defaultRegion = this.configService.get<string>('DEFAULT_REGION', 'US');
  }

  async getUserContext(userId: string): Promise<CulturalContext> {
    const startTime = Date.now();
    try {
      const [language, region] = await Promise.all([
        this.getUserLanguage(userId),
        this.getUserRegion(userId),
      ]);

      const preferences = await this.getUserPreferences(userId);
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('cultural_context', 'get_user_context', duration);

      return {
        language: language || this.defaultLanguage,
        region: region || this.defaultRegion,
        preferences: preferences || {},
      };
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('cultural_context', 'get_user_context_error', duration);
      throw error;
    }
  }

  private async getUserLanguage(userId: string): Promise<string | null> {
    const startTime = Date.now();
    try {
      const result = await this.supabaseService.select<UserPreference>('user_preferences', {
        filters: [
          { field: 'user_id', operator: 'eq', value: userId },
          { field: 'key', operator: 'eq', value: 'language' },
        ],
      });

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('cultural_context', 'get_user_language', duration);

      return result[0]?.value || null;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('cultural_context', 'get_user_language_error', duration);
      throw error;
    }
  }

  private async getUserRegion(userId: string): Promise<string | null> {
    const startTime = Date.now();
    try {
      const result = await this.supabaseService.select<UserPreference>('user_preferences', {
        filters: [
          { field: 'user_id', operator: 'eq', value: userId },
          { field: 'key', operator: 'eq', value: 'region' },
        ],
      });

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('cultural_context', 'get_user_region', duration);

      return result[0]?.value || null;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('cultural_context', 'get_user_region_error', duration);
      throw error;
    }
  }

  private async getUserPreferences(userId: string): Promise<Record<string, string>> {
    const startTime = Date.now();
    try {
      const result = await this.supabaseService.select<UserPreference>('user_preferences', {
        filters: [
          { field: 'user_id', operator: 'eq', value: userId },
          { field: 'key', operator: 'neq', value: 'language' },
          { field: 'key', operator: 'neq', value: 'region' },
        ],
      });

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('cultural_context', 'get_user_preferences', duration);

      return result.reduce<Record<string, string>>((acc, pref) => {
        acc[pref.key] = pref.value;
        return acc;
      }, {});
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('cultural_context', 'get_user_preferences_error', duration);
      throw error;
    }
  }

  async setUserPreference(userId: string, key: string, value: string): Promise<void> {
    const startTime = Date.now();
    try {
      await this.supabaseService.upsert<UserPreference>('user_preferences', {
        user_id: userId,
        key,
        value,
      }, 'user_id_key_pkey');

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('cultural_context', 'set_user_preference', duration);
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('cultural_context', 'set_user_preference_error', duration);
      throw error;
    }
  }

  async deleteUserPreference(userId: string, key: string): Promise<void> {
    const startTime = Date.now();
    try {
      await this.supabaseService.delete('user_preferences', {
        filters: [
          { field: 'user_id', operator: 'eq', value: userId },
          { field: 'key', operator: 'eq', value: key },
        ],
      });

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('cultural_context', 'delete_user_preference', duration);
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('cultural_context', 'delete_user_preference_error', duration);
      throw error;
    }
  }

  async getAvailablePreferences(): Promise<CulturalPreference[]> {
    const startTime = Date.now();
    try {
      const result = await this.supabaseService.select<CulturalPreference>('cultural_preferences');
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('cultural_context', 'get_available_preferences', duration);
      return result;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('cultural_context', 'get_available_preferences_error', duration);
      throw error;
    }
  }
}
