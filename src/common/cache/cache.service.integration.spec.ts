import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from '../metrics/metrics.service';

describe('CacheService Integration', () => {
  let module: TestingModule;
  let cacheService: CacheService;
  let metricsService: MetricsService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              switch (key) {
                case 'REDIS_URL':
                  return 'redis://localhost:6379';
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
          },
        },
      ],
    }).compile();

    cacheService = module.get<CacheService>(CacheService);
    metricsService = module.get<MetricsService>(MetricsService);

    await cacheService.onModuleInit();
  });

  afterEach(async () => {
    await cacheService.clear();
    await module.close();
  });

  describe('get/set operations', () => {
    it('should store and retrieve a value', async () => {
      const key = 'test-key';
      const value = { foo: 'bar' };

      await cacheService.set(key, value);
      const result = await cacheService.get<typeof value>(key);

      expect(result).toEqual(value);
      expect(metricsService.recordLatency).toHaveBeenCalledWith('redis', 'set', expect.any(Number));
      expect(metricsService.recordLatency).toHaveBeenCalledWith('redis', 'get', expect.any(Number));
    });

    it('should store a value with TTL', async () => {
      const key = 'test-ttl-key';
      const value = { foo: 'bar' };
      const ttl = 1; // 1 second

      await cacheService.set(key, value, ttl);
      const result1 = await cacheService.get<typeof value>(key);
      expect(result1).toEqual(value);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      const result2 = await cacheService.get<typeof value>(key);
      expect(result2).toBeNull();
    });

    it('should return null for non-existent keys', async () => {
      const result = await cacheService.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should handle complex objects', async () => {
      const key = 'complex-key';
      const value = {
        string: 'test',
        number: 123,
        boolean: true,
        array: [1, 2, 3],
        nested: {
          foo: 'bar',
          baz: [{ qux: 'quux' }],
        },
      };

      await cacheService.set(key, value);
      const result = await cacheService.get<typeof value>(key);

      expect(result).toEqual(value);
    });
  });

  describe('delete operation', () => {
    it('should delete a stored value', async () => {
      const key = 'delete-test-key';
      const value = { foo: 'bar' };

      await cacheService.set(key, value);
      await cacheService.delete(key);
      const result = await cacheService.get<typeof value>(key);

      expect(result).toBeNull();
      expect(metricsService.recordLatency).toHaveBeenCalledWith('redis', 'delete', expect.any(Number));
    });

    it('should not error when deleting non-existent keys', async () => {
      await expect(cacheService.delete('non-existent-key')).resolves.not.toThrow();
    });
  });

  describe('clear operation', () => {
    it('should remove all stored values', async () => {
      const testData = {
        'key1': { foo: 'bar1' },
        'key2': { foo: 'bar2' },
        'key3': { foo: 'bar3' },
      };

      await Promise.all(
        Object.entries(testData).map(([key, value]) => cacheService.set(key, value))
      );

      await cacheService.clear();

      const results = await Promise.all(
        Object.keys(testData).map(key => cacheService.get(key))
      );

      expect(results.every(result => result === null)).toBe(true);
      expect(metricsService.recordLatency).toHaveBeenCalledWith('redis', 'clear', expect.any(Number));
    });
  });

  describe('getStats operation', () => {
    it('should return cache statistics', async () => {
      // Add some test data
      await Promise.all([
        cacheService.set('key1', 'value1'),
        cacheService.set('key2', 'value2'),
        cacheService.set('key3', 'value3'),
      ]);

      const stats = await cacheService.getStats();

      expect(stats).toHaveProperty('totalEntries');
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('oldestEntry');
      expect(stats).toHaveProperty('newestEntry');
      expect(metricsService.recordLatency).toHaveBeenCalledWith('redis', 'stats', expect.any(Number));
    });
  });

  describe('cleanup operation', () => {
    it('should remove expired entries', async () => {
      // Add some test data with different TTLs
      await Promise.all([
        cacheService.set('key1', 'value1', 1), // 1 second TTL
        cacheService.set('key2', 'value2'), // No TTL
        cacheService.set('key3', 'value3', 5), // 5 seconds TTL
      ]);

      // Wait for first key to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      const deletedCount = await cacheService.cleanup(0);
      expect(deletedCount).toBeGreaterThan(0);

      const results = await Promise.all([
        cacheService.get('key1'),
        cacheService.get('key2'),
        cacheService.get('key3'),
      ]);

      expect(results[0]).toBeNull(); // Should be expired and cleaned up
      expect(results[1]).not.toBeNull(); // Should still exist
      expect(results[2]).not.toBeNull(); // Should still exist

      expect(metricsService.recordLatency).toHaveBeenCalledWith('redis', 'cleanup', expect.any(Number));
    });
  });

  describe('error handling', () => {
    it('should handle connection errors gracefully', async () => {
      // Simulate a connection error by closing the connection
      await module.close();

      await expect(cacheService.get('test-key')).rejects.toThrow();
      expect(metricsService.recordLatency).toHaveBeenCalledWith('redis', 'get_error', expect.any(Number));
    });

    it('should handle serialization errors', async () => {
      const key = 'circular-ref-key';
      const value = { foo: null as any };
      value.foo = value; // Create circular reference

      await expect(cacheService.set(key, value)).rejects.toThrow();
      expect(metricsService.recordLatency).toHaveBeenCalledWith('redis', 'set_error', expect.any(Number));
    });
  });
});
