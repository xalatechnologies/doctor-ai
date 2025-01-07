import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CulturalContextService } from './cultural-context.service';
import { CacheService } from '../cache/cache.service';

describe('CulturalContextService Integration', () => {
  let service: CulturalContextService;
  let cacheService: CacheService;
  let configService: ConfigService;

  const TEST_USER_ID = 'test-user-123';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CulturalContextService,
        CacheService,
        {
          provide: ConfigService,
          useValue: new ConfigService(),
        },
      ],
    }).compile();

    service = module.get<CulturalContextService>(CulturalContextService);
    cacheService = module.get<CacheService>(CacheService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('Language Preferences', () => {
    it('should set and get user language preference', async () => {
      await service.setLanguagePreference(TEST_USER_ID, 'es');
      const language = await service.getLanguagePreference(TEST_USER_ID);
      expect(language).toBe('es');
    });

    it('should return default language when no preference set', async () => {
      const language = await service.getLanguagePreference('new-user');
      expect(language).toBe('en'); // Default language
    });

    it('should validate language codes', async () => {
      await expect(service.setLanguagePreference(TEST_USER_ID, 'invalid'))
        .rejects
        .toThrow();
    });
  });

  describe('Cultural Settings', () => {
    it('should set and get date format preference', async () => {
      await service.setCulturalSetting(TEST_USER_ID, 'dateFormat', 'DD/MM/YYYY');
      const format = await service.getCulturalSetting(TEST_USER_ID, 'dateFormat');
      expect(format).toBe('DD/MM/YYYY');
    });

    it('should set and get time format preference', async () => {
      await service.setCulturalSetting(TEST_USER_ID, 'timeFormat', '24h');
      const format = await service.getCulturalSetting(TEST_USER_ID, 'timeFormat');
      expect(format).toBe('24h');
    });

    it('should set and get measurement unit preference', async () => {
      await service.setCulturalSetting(TEST_USER_ID, 'measurementUnit', 'metric');
      const unit = await service.getCulturalSetting(TEST_USER_ID, 'measurementUnit');
      expect(unit).toBe('metric');
    });
  });

  describe('Localization', () => {
    it('should get localized text', async () => {
      const text = await service.getLocalizedText('common.welcome', 'es');
      expect(text).toBeDefined();
      expect(typeof text).toBe('string');
    });

    it('should handle missing translations', async () => {
      const text = await service.getLocalizedText('nonexistent.key', 'es');
      expect(text).toBe('nonexistent.key'); // Returns key when translation missing
    });

    it('should handle interpolation', async () => {
      const text = await service.getLocalizedText('common.greeting', 'es', {
        name: 'Juan',
      });
      expect(text).toContain('Juan');
    });
  });

  describe('Regional Settings', () => {
    it('should get region-specific medical units', async () => {
      const units = await service.getRegionalMedicalUnits('US');
      expect(units).toEqual({
        weight: 'lb',
        height: 'ft',
        temperature: 'F',
      });
    });

    it('should get region-specific date formats', async () => {
      const format = await service.getRegionalDateFormat('GB');
      expect(format).toBe('DD/MM/YYYY');
    });

    it('should get region-specific number formats', async () => {
      const format = await service.getRegionalNumberFormat('DE');
      expect(format).toEqual({
        decimal: ',',
        thousands: '.',
      });
    });
  });

  describe('Cultural Adaptations', () => {
    it('should get culturally appropriate greetings', async () => {
      const greeting = await service.getCulturalGreeting('JP', new Date());
      expect(greeting).toBeDefined();
      expect(typeof greeting).toBe('string');
    });

    it('should get culturally appropriate medical terms', async () => {
      const term = await service.getCulturalMedicalTerm('headache', 'CN');
      expect(term).toBeDefined();
      expect(typeof term).toBe('string');
    });

    it('should handle cultural sensitivities', async () => {
      const adaptations = await service.getCulturalSensitivities('SA');
      expect(adaptations).toEqual(expect.arrayContaining([
        expect.objectContaining({
          category: expect.any(String),
          considerations: expect.any(Array),
        }),
      ]));
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid region codes', async () => {
      await expect(service.getRegionalDateFormat('INVALID'))
        .rejects
        .toThrow();
    });

    it('should handle unavailable languages', async () => {
      await expect(service.getLocalizedText('common.welcome', 'xx'))
        .rejects
        .toThrow();
    });

    it('should handle missing cultural data', async () => {
      await expect(service.getCulturalSensitivities('XX'))
        .rejects
        .toThrow();
    });
  });

  describe('Performance', () => {
    it('should cache frequently accessed cultural data', async () => {
      const startTime = Date.now();
      
      // First access - should be slower
      await service.getLocalizedText('common.welcome', 'es');
      const firstAccessTime = Date.now() - startTime;

      // Second access - should be faster due to caching
      const cachedStartTime = Date.now();
      await service.getLocalizedText('common.welcome', 'es');
      const cachedAccessTime = Date.now() - cachedStartTime;

      expect(cachedAccessTime).toBeLessThan(firstAccessTime);
    });

    it('should handle concurrent cultural requests efficiently', async () => {
      const requests = Array.from({ length: 100 }, (_, i) => ({
        key: `common.key${i}`,
        language: 'es',
      }));

      const startTime = Date.now();
      
      await Promise.all(
        requests.map(req => service.getLocalizedText(req.key, req.language))
      );

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
}); 