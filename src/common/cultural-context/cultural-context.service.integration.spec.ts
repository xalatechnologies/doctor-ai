import { Test, TestingModule } from '@nestjs/testing';
import { CulturalContextService } from './cultural-context.service';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from '../metrics/metrics.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('CulturalContextService Integration', () => {
  let module: TestingModule;
  let culturalContextService: CulturalContextService;
  let supabaseService: SupabaseService;
  let metricsService: MetricsService;

  const mockUserPreferences = [
    { user_id: 'test-user', key: 'language', value: 'es' },
    { user_id: 'test-user', key: 'region', value: 'MX' },
    { user_id: 'test-user', key: 'dateFormat', value: 'DD/MM/YYYY' },
    { user_id: 'test-user', key: 'timeFormat', value: '24h' },
  ];

  const mockCulturalPreferences = [
    { key: 'dateFormat', value: 'DD/MM/YYYY', description: 'European date format' },
    { key: 'timeFormat', value: '24h', description: '24-hour time format' },
    { key: 'measurementUnit', value: 'metric', description: 'Metric system' },
  ];

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        CulturalContextService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              switch (key) {
                case 'DEFAULT_LANGUAGE':
                  return 'en';
                case 'DEFAULT_REGION':
                  return 'US';
                default:
                  return undefined;
              }
            }),
          },
        },
        {
          provide: SupabaseService,
          useValue: {
            select: jest.fn().mockImplementation((table: string, query?: any) => {
              if (table === 'user_preferences') {
                return mockUserPreferences.filter(pref => {
                  return query?.filters?.every((filter: any) => {
                    const field = filter.field as keyof typeof pref;
                    switch (filter.operator) {
                      case 'eq':
                        return pref[field] === filter.value;
                      case 'neq':
                        return pref[field] !== filter.value;
                      default:
                        return true;
                    }
                  });
                });
              } else if (table === 'cultural_preferences') {
                return mockCulturalPreferences;
              }
              return [];
            }),
            upsert: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: MetricsService,
          useValue: {
            recordLatency: jest.fn(),
          },
        },
      ],
    }).compile();

    culturalContextService = module.get<CulturalContextService>(CulturalContextService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
    metricsService = module.get<MetricsService>(MetricsService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('getUserContext', () => {
    it('should return user context with preferences', async () => {
      const userId = 'test-user';
      const context = await culturalContextService.getUserContext(userId);

      expect(context).toEqual({
        language: 'es',
        region: 'MX',
        preferences: {
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24h',
        },
      });

      expect(metricsService.recordLatency).toHaveBeenCalledWith('cultural_context', 'get_user_context', expect.any(Number));
    });

    it('should use default values for missing preferences', async () => {
      const userId = 'new-user';
      const context = await culturalContextService.getUserContext(userId);

      expect(context).toEqual({
        language: 'en',
        region: 'US',
        preferences: {},
      });
    });

    it('should handle database errors gracefully', async () => {
      jest.spyOn(supabaseService, 'select').mockRejectedValue(new Error('Database error'));

      await expect(culturalContextService.getUserContext('test-user')).rejects.toThrow();
      expect(metricsService.recordLatency).toHaveBeenCalledWith('cultural_context', 'get_user_context_error', expect.any(Number));
    });
  });

  describe('setUserPreference', () => {
    it('should set a user preference', async () => {
      const userId = 'test-user';
      const key = 'theme';
      const value = 'dark';

      await culturalContextService.setUserPreference(userId, key, value);

      expect(supabaseService.upsert).toHaveBeenCalledWith(
        'user_preferences',
        { user_id: userId, key, value },
        'user_id_key_pkey',
      );
      expect(metricsService.recordLatency).toHaveBeenCalledWith('cultural_context', 'set_user_preference', expect.any(Number));
    });

    it('should handle database errors when setting preferences', async () => {
      jest.spyOn(supabaseService, 'upsert').mockRejectedValue(new Error('Database error'));

      await expect(culturalContextService.setUserPreference('test-user', 'theme', 'dark')).rejects.toThrow();
      expect(metricsService.recordLatency).toHaveBeenCalledWith('cultural_context', 'set_user_preference_error', expect.any(Number));
    });
  });

  describe('deleteUserPreference', () => {
    it('should delete a user preference', async () => {
      const userId = 'test-user';
      const key = 'theme';

      await culturalContextService.deleteUserPreference(userId, key);

      expect(supabaseService.delete).toHaveBeenCalledWith('user_preferences', {
        filters: [
          { field: 'user_id', operator: 'eq', value: userId },
          { field: 'key', operator: 'eq', value: key },
        ],
      });
      expect(metricsService.recordLatency).toHaveBeenCalledWith('cultural_context', 'delete_user_preference', expect.any(Number));
    });

    it('should handle database errors when deleting preferences', async () => {
      jest.spyOn(supabaseService, 'delete').mockRejectedValue(new Error('Database error'));

      await expect(culturalContextService.deleteUserPreference('test-user', 'theme')).rejects.toThrow();
      expect(metricsService.recordLatency).toHaveBeenCalledWith('cultural_context', 'delete_user_preference_error', expect.any(Number));
    });
  });

  describe('getAvailablePreferences', () => {
    it('should return available cultural preferences', async () => {
      const preferences = await culturalContextService.getAvailablePreferences();

      expect(preferences).toEqual(mockCulturalPreferences);
      expect(metricsService.recordLatency).toHaveBeenCalledWith('cultural_context', 'get_available_preferences', expect.any(Number));
    });

    it('should handle database errors when getting available preferences', async () => {
      jest.spyOn(supabaseService, 'select').mockRejectedValue(new Error('Database error'));

      await expect(culturalContextService.getAvailablePreferences()).rejects.toThrow();
      expect(metricsService.recordLatency).toHaveBeenCalledWith('cultural_context', 'get_available_preferences_error', expect.any(Number));
    });
  });
});

