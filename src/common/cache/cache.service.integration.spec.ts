import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { MetricsService } from '../metrics/metrics.service';

// Mock the Redis class
const mockRedisClient = {
  ping: jest.fn().mockResolvedValue('PONG'),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  setex: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  flushdb: jest.fn().mockResolvedValue('OK'),
  scan: jest.fn().mockResolvedValue(['0', []]),
  ttl: jest.fn().mockResolvedValue(-1),
  info: jest.fn().mockResolvedValue('db0:keys=1,expires=0,avg_ttl=0'),
  keys: jest.fn().mockResolvedValue([]),
  connect: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
};

jest.mock('ioredis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => mockRedisClient),
  };
});

describe('CacheService Integration', () => {
  let service: CacheService;
  let metricsService: jest.Mocked<MetricsService>;

  beforeEach(async () => {
    const mockMetricsService = {
      recordLatency: jest.fn(),
      logError: jest.fn(),
      incrementProviderError: jest.fn(),
      recordTaskMetrics: jest.fn(),
      setConnectionStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              switch (key) {
                case 'REDIS_HOST':
                  return 'localhost';
                case 'REDIS_PORT':
                  return 6379;
                case 'REDIS_PASSWORD':
                  return '';
                default:
                  return undefined;
              }
            }),
          },
        },
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    metricsService = module.get(MetricsService);
    await service.onModuleInit();
  });

  afterEach(async () => {
    try {
      await service.clear();
    } catch (error) {
      // Ignore clear errors in cleanup
    }
    jest.clearAllMocks();
  });

  describe('get/set operations', () => {
    it('should store and retrieve a value', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(value));

      await service.set(key, value);
      const result = await service.get(key);
      expect(result).toEqual(value);
      expect(mockRedisClient.set).toHaveBeenCalledWith(key, JSON.stringify(value));
    });

    it('should store a value with TTL', async () => {
      const key = 'test-key-ttl';
      const value = { data: 'test-value' };
      const ttl = 60;
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(value));

      await service.set(key, value, ttl);
      const result = await service.get(key);
      expect(result).toEqual(value);
      expect(mockRedisClient.setex).toHaveBeenCalledWith(key, ttl, JSON.stringify(value));
    });

    it('should return null for non-existent keys', async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);
      const result = await service.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should handle complex objects', async () => {
      const key = 'complex-key';
      const value = {
        nested: { data: 'test' },
        array: [1, 2, 3],
        date: new Date('2025-01-08T09:54:19.842Z'),
      };
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(value));

      await service.set(key, value);
      const result = await service.get(key);
      expect(result).toEqual({
        nested: { data: 'test' },
        array: [1, 2, 3],
        date: '2025-01-08T09:54:19.842Z',
      });
    });
  });

  describe('delete operation', () => {
    it('should delete a stored value', async () => {
      const key = 'delete-test-key';
      await service.delete(key);
      expect(mockRedisClient.del).toHaveBeenCalledWith(key);
    });

    it('should not error when deleting non-existent keys', async () => {
      await expect(service.delete('non-existent-key')).resolves.not.toThrow();
    });
  });

  describe('clear operation', () => {
    it('should remove all stored values', async () => {
      await service.clear();
      expect(mockRedisClient.flushdb).toHaveBeenCalled();
    });
  });

  describe('getStats operation', () => {
    it('should return cache statistics', async () => {
      const stats = await service.getStats();
      expect(stats).toEqual({
        totalEntries: 0,
        totalSize: 0,
        oldestEntry: 0,
        newestEntry: expect.any(Number),
      });
    });
  });

  describe('cleanup operation', () => {
    it('should remove expired entries', async () => {
      mockRedisClient.keys.mockResolvedValueOnce(['key1', 'key2']);
      mockRedisClient.ttl.mockResolvedValueOnce(100);
      mockRedisClient.ttl.mockResolvedValueOnce(-1);
      const maxAgeMs = 3600000; // 1 hour
      const removedCount = await service.cleanup(maxAgeMs);
      expect(removedCount).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle connection errors gracefully', async () => {
      mockRedisClient.ping.mockRejectedValueOnce(new Error('Connection failed'));
      await expect(service.onModuleInit()).resolves.not.toThrow();
      expect(metricsService.logError).toHaveBeenCalledWith('cache', 'connection_error');
    });

    it('should handle serialization errors', async () => {
      const key = 'circular-ref';
      const value = { self: {} };
      (value as any).self = value;
      await expect(service.set(key, value)).resolves.toBe(false);
      expect(metricsService.logError).toHaveBeenCalledWith('cache', 'set_error');
    });
  });
});
