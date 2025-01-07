import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import Redis from 'ioredis';

describe('CacheService Integration', () => {
  let service: CacheService;
  let redisClient: Redis;
  let configService: ConfigService;

  const TEST_PREFIX = 'test:';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: ConfigService,
          useValue: new ConfigService(),
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    configService = module.get<ConfigService>(ConfigService);

    // Initialize the service
    await service.onModuleInit();
    redisClient = service.getClient();
  });

  afterAll(async () => {
    // Clean up all test keys
    const keys = await redisClient.keys(`${TEST_PREFIX}*`);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
    await redisClient.quit();
  });

  beforeEach(async () => {
    // Clean up test keys before each test
    const keys = await redisClient.keys(`${TEST_PREFIX}*`);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  });

  describe('Basic Operations', () => {
    it('should set and get a string value', async () => {
      const key = `${TEST_PREFIX}string`;
      const value = 'test-value';

      await service.set(key, value);
      const result = await service.get(key);

      expect(result).toBe(value);
    });

    it('should set and get a JSON value', async () => {
      const key = `${TEST_PREFIX}json`;
      const value = { name: 'test', value: 123 };

      await service.set(key, value);
      const result = await service.get(key);

      expect(result).toEqual(value);
    });

    it('should set with expiration', async () => {
      const key = `${TEST_PREFIX}expiring`;
      const value = 'expiring-value';
      const ttl = 1; // 1 second

      await service.set(key, value, ttl);
      
      // Value should exist initially
      let result = await service.get(key);
      expect(result).toBe(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Value should be gone
      result = await service.get(key);
      expect(result).toBeNull();
    });

    it('should delete a value', async () => {
      const key = `${TEST_PREFIX}delete`;
      const value = 'delete-me';

      await service.set(key, value);
      await service.delete(key);

      const result = await service.get(key);
      expect(result).toBeNull();
    });
  });

  describe('Advanced Operations', () => {
    it('should increment a counter', async () => {
      const key = `${TEST_PREFIX}counter`;

      let value = await service.increment(key);
      expect(value).toBe(1);

      value = await service.increment(key);
      expect(value).toBe(2);

      value = await service.increment(key, 3);
      expect(value).toBe(5);
    });

    it('should handle lists', async () => {
      const key = `${TEST_PREFIX}list`;
      const items = ['item1', 'item2', 'item3'];

      // Add items
      for (const item of items) {
        await service.listPush(key, item);
      }

      // Get all items
      const result = await service.listRange(key, 0, -1);
      expect(result).toEqual(items);

      // Pop an item
      const popped = await service.listPop(key);
      expect(popped).toBe(items[items.length - 1]);
    });

    it('should handle sets', async () => {
      const key = `${TEST_PREFIX}set`;
      const items = ['member1', 'member2', 'member3'];

      // Add members
      await service.setAdd(key, ...items);

      // Check membership
      const isMember = await service.setIsMember(key, 'member1');
      expect(isMember).toBe(true);

      // Get all members
      const members = await service.setMembers(key);
      expect(members.sort()).toEqual(items.sort());
    });

    it('should handle hash maps', async () => {
      const key = `${TEST_PREFIX}hash`;
      const fields = {
        field1: 'value1',
        field2: 'value2',
      };

      // Set hash fields
      await service.hashSet(key, fields);

      // Get specific field
      const value = await service.hashGet(key, 'field1');
      expect(value).toBe(fields.field1);

      // Get all fields
      const allFields = await service.hashGetAll(key);
      expect(allFields).toEqual(fields);
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors', async () => {
      // Force connection error by closing client
      await redisClient.disconnect();

      await expect(service.get('any-key'))
        .rejects
        .toThrow();

      // Reconnect for other tests
      await redisClient.connect();
    });

    it('should handle invalid JSON data', async () => {
      const key = `${TEST_PREFIX}invalid-json`;
      
      // Manually set invalid JSON
      await redisClient.set(key, '{invalid-json}');

      const result = await service.get(key);
      expect(result).toBe('{invalid-json}'); // Should return raw string
    });

    it('should handle type mismatches', async () => {
      const key = `${TEST_PREFIX}type-mismatch`;

      // Set as string
      await service.set(key, 'string-value');

      // Try to use as list
      await expect(service.listPush(key, 'value'))
        .rejects
        .toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle multiple operations efficiently', async () => {
      const operations = Array.from({ length: 1000 }, (_, i) => ({
        key: `${TEST_PREFIX}perf:${i}`,
        value: `value-${i}`,
      }));

      // Measure time for batch operations
      const startTime = Date.now();
      
      await Promise.all(
        operations.map(op => service.set(op.key, op.value))
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust as needed)
      expect(duration).toBeLessThan(5000);

      // Verify all values were set
      const firstKey = operations[0].key;
      const lastKey = operations[operations.length - 1].key;
      
      const results = await Promise.all([
        service.get(firstKey),
        service.get(lastKey),
      ]);

      expect(results[0]).toBe(operations[0].value);
      expect(results[1]).toBe(operations[operations.length - 1].value);
    });
  });
}); 