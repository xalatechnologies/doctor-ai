import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from '../metrics/metrics.service';

jest.setTimeout(30000); // Increase timeout to 30 seconds

describe('CacheService Integration', () => {
  let service: CacheService;
  let configService: ConfigService;
  let metricsService: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              switch (key) {
                case 'REDIS_URL':
                  return 'redis://localhost:6379';
                case 'REDIS_TTL':
                  return '3600';
                case 'REDIS_PREFIX':
                  return 'test:';
                default:
                  return undefined;
              }
            }),
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

    service = module.get<CacheService>(CacheService);
    configService = module.get<ConfigService>(ConfigService);
    metricsService = module.get<MetricsService>(MetricsService);

    try {
      // Initialize the service
      await service.onModuleInit();
      
      // Clean up before each test
      const client = service.getClient();
      await client.flushall();
    } catch (error) {
      console.error('Error during test setup:', error);
      throw error;
    }
  });

  afterEach(async () => {
    try {
      // Clean up after each test
      const client = service.getClient();
      await client.flushall();
      await client.quit();
    } catch (error) {
      console.error('Error during test cleanup:', error);
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('configuration', () => {
    it('should load Redis configuration', () => {
      expect(configService.get('REDIS_URL')).toBe('redis://localhost:6379');
      expect(configService.get('REDIS_TTL')).toBe('3600');
      expect(configService.get('REDIS_PREFIX')).toBe('test:');
    });
  });

  describe('set and get', () => {
    it('should store and retrieve values', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      await service.set(key, value);
      const result = await service.get(key);

      expect(result).toEqual(value);
      expect(metricsService.recordLatency).toHaveBeenCalledWith('cache', 'set', expect.any(Number));
      expect(metricsService.recordLatency).toHaveBeenCalledWith('cache', 'get', expect.any(Number));
    });

    it('should handle non-existent keys', async () => {
      const result = await service.get('non-existent-key');
      expect(result).toBeNull();
      expect(metricsService.recordLatency).toHaveBeenCalledWith('cache', 'get', expect.any(Number));
    });

    it('should handle errors gracefully', async () => {
      const client = service.getClient();
      jest.spyOn(client, 'set').mockRejectedValueOnce(new Error('Redis error'));

      await expect(service.set('test-key', 'test-value')).rejects.toThrow();
      expect(metricsService.logError).toHaveBeenCalledWith('cache', 'set_error');
    });
  });

  describe('delete', () => {
    it('should remove stored values', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      await service.set(key, value);
      await service.delete(key);

      const result = await service.get(key);
      expect(result).toBeNull();
      expect(metricsService.recordLatency).toHaveBeenCalledWith('cache', 'delete', expect.any(Number));
    });
  });

  describe('list operations', () => {
    it('should handle list operations', async () => {
      const key = 'test-list';
      const values = ['value1', 'value2', 'value3'];

      // Push values
      for (const value of values) {
        await service.listPush(key, value);
      }

      // Get range
      const result = await service.listRange(key, 0, -1);
      expect(result).toEqual(values);
      expect(metricsService.recordLatency).toHaveBeenCalledWith('cache', 'list_push', expect.any(Number));
      expect(metricsService.recordLatency).toHaveBeenCalledWith('cache', 'list_range', expect.any(Number));

      // Pop value
      const popped = await service.listPop(key);
      expect(popped).toBe(values[values.length - 1]);
      expect(metricsService.recordLatency).toHaveBeenCalledWith('cache', 'list_pop', expect.any(Number));
    });
  });
});
