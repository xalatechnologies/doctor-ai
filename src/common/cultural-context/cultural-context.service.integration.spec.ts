import { Test, TestingModule } from '@nestjs/testing';
import { CulturalContextService } from './cultural-context.service';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../cache/cache.service';
import { MetricsService } from '../metrics/metrics.service';

describe('CulturalContextService Integration', () => {
  let service: CulturalContextService;
  let configService: ConfigService;
  let cacheService: CacheService;
  let metricsService: MetricsService;

  const TEST_USER_ID = 'test-user-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CulturalContextService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              switch (key) {
                case 'CULTURAL_API_KEY':
                  return 'test-api-key';
                case 'CULTURAL_API_URL':
                  return 'https://api.cultural-context.test';
                case 'CULTURAL_CACHE_TTL':
                  return '3600';
                default:
                  return undefined;
              }
            }),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: MetricsService,
          useValue: {
            recordLatency: jest.fn(),
            logError: jest.fn(),
            incrementLogCount: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CulturalContextService>(CulturalContextService);
    configService = module.get<ConfigService>(ConfigService);
    cacheService = module.get<CacheService>(CacheService);
    metricsService = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('configuration', () => {
    it('should load cultural service configuration', () => {
      expect(configService.get('CULTURAL_API_KEY')).toBe('test-api-key');
      expect(configService.get('CULTURAL_API_URL')).toBe('https://api.cultural-context.test');
      expect(configService.get('CULTURAL_CACHE_TTL')).toBe('3600');
    });
  });

  describe('Language Preferences', () => {
    it('should set and get user language preference', async () => {
      jest.spyOn(cacheService, 'set').mockResolvedValueOnce();
      jest.spyOn(cacheService, 'get').mockResolvedValueOnce('es');

      await service.setLanguagePreference(TEST_USER_ID, 'es');
      const language = await service.getLanguagePreference(TEST_USER_ID);
      
      expect(language).toBe('es');
      expect(cacheService.set).toHaveBeenCalledWith(`lang:${TEST_USER_ID}`, 'es');
      expect(cacheService.get).toHaveBeenCalledWith(`lang:${TEST_USER_ID}`);
      expect(metricsService.recordLatency).toHaveBeenCalledWith('cultural', 'set_language', expect.any(Number));
    });

    it('should return default language when no preference set', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValueOnce(null);

      const language = await service.getLanguagePreference(TEST_USER_ID);
      expect(language).toBe('en');
      expect(cacheService.get).toHaveBeenCalledWith(`lang:${TEST_USER_ID}`);
      expect(metricsService.recordLatency).toHaveBeenCalledWith('cultural', 'get_language', expect.any(Number));
    });

    it('should validate language codes', async () => {
      await expect(
        service.setLanguagePreference(TEST_USER_ID, 'invalid'),
      ).rejects.toThrow();
      expect(metricsService.logError).toHaveBeenCalledWith('cultural', 'invalid_language');
    });
  });

  describe('Cultural Settings', () => {
    it('should set and get cultural settings', async () => {
      jest.spyOn(cacheService, 'set').mockResolvedValueOnce();
      jest.spyOn(cacheService, 'get').mockResolvedValueOnce('DD/MM/YYYY');

      await service.setCulturalSetting(TEST_USER_ID, 'dateFormat', 'DD/MM/YYYY');
      const format = await service.getCulturalSetting(TEST_USER_ID, 'dateFormat');

      expect(format).toBe('DD/MM/YYYY');
      expect(cacheService.set).toHaveBeenCalledWith(
        `cultural:${TEST_USER_ID}:dateFormat`,
        'DD/MM/YYYY',
      );
      expect(cacheService.get).toHaveBeenCalledWith(
        `cultural:${TEST_USER_ID}:dateFormat`,
      );
      expect(metricsService.recordLatency).toHaveBeenCalledWith('cultural', 'set_setting', expect.any(Number));
    });

    it('should handle cache errors', async () => {
      jest.spyOn(cacheService, 'set').mockRejectedValueOnce(new Error('Cache error'));

      await expect(
        service.setCulturalSetting(TEST_USER_ID, 'dateFormat', 'DD/MM/YYYY'),
      ).rejects.toThrow();
      expect(metricsService.logError).toHaveBeenCalledWith('cultural', 'cache_error');
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
      expect(metricsService.recordLatency).toHaveBeenCalledWith('cultural', 'get_medical_units', expect.any(Number));
    });

    it('should get region-specific date formats', async () => {
      const format = await service.getRegionalDateFormat('GB');
      expect(format).toBe('DD/MM/YYYY');
      expect(metricsService.recordLatency).toHaveBeenCalledWith('cultural', 'get_date_format', expect.any(Number));
    });

    it('should get region-specific number formats', async () => {
      const format = await service.getRegionalNumberFormat('DE');
      expect(format).toEqual({
        decimal: ',',
        thousands: '.',
      });
      expect(metricsService.recordLatency).toHaveBeenCalledWith('cultural', 'get_number_format', expect.any(Number));
    });

    it('should handle invalid region codes', async () => {
      await expect(service.getRegionalMedicalUnits('XX')).rejects.toThrow();
      expect(metricsService.logError).toHaveBeenCalledWith('cultural', 'invalid_region');
    });
  });
});
