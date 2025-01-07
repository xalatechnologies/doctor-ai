import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';
import { SupabaseClient } from '@supabase/supabase-js';

describe('DatabaseService Integration', () => {
  let service: DatabaseService;
  let configService: ConfigService;
  let supabaseClient: SupabaseClient;

  // Test data interface
  interface TestRecord {
    id: string;
    name: string;
    value: number;
    created_at?: string;
  }

  const TEST_TABLE = 'integration_test_table';

  beforeAll(async () => {
    // Load actual environment variables for integration test
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseService,
        {
          provide: ConfigService,
          useValue: new ConfigService(),
        },
      ],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
    configService = module.get<ConfigService>(ConfigService);

    // Initialize the service
    await service.onModuleInit();
    supabaseClient = service.getClient();

    // Create test table if it doesn't exist
    await supabaseClient.rpc('create_test_table', {
      table_name: TEST_TABLE,
      schema: `
        id uuid primary key default uuid_generate_v4(),
        name text not null,
        value integer not null,
        created_at timestamp with time zone default now()
      `,
    });
  });

  afterAll(async () => {
    // Clean up test table
    await supabaseClient.rpc('drop_test_table', {
      table_name: TEST_TABLE,
    });
  });

  beforeEach(async () => {
    // Clear test table before each test
    await supabaseClient.from(TEST_TABLE).delete().neq('id', '');
  });

  describe('CRUD Operations', () => {
    it('should insert a record', async () => {
      const testData: Partial<TestRecord> = {
        name: 'test',
        value: 123,
      };

      const { data, error } = await service.insert<TestRecord>(TEST_TABLE, testData);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.name).toBe(testData.name);
      expect(data?.value).toBe(testData.value);
      expect(data?.id).toBeDefined();
      expect(data?.created_at).toBeDefined();
    });

    it('should select a record', async () => {
      // Insert test record
      const testData: Partial<TestRecord> = {
        name: 'test_select',
        value: 456,
      };
      const { data: insertedData } = await service.insert<TestRecord>(TEST_TABLE, testData);
      expect(insertedData).toBeDefined();

      // Select the record
      const { data, error } = await service.select<TestRecord>(TEST_TABLE, {
        id: insertedData!.id,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.name).toBe(testData.name);
      expect(data?.value).toBe(testData.value);
    });

    it('should update a record', async () => {
      // Insert test record
      const testData: Partial<TestRecord> = {
        name: 'test_update',
        value: 789,
      };
      const { data: insertedData } = await service.insert<TestRecord>(TEST_TABLE, testData);
      expect(insertedData).toBeDefined();

      // Update the record
      const updateData: Partial<TestRecord> = {
        value: 999,
      };
      const { data, error } = await service.update<TestRecord>(
        TEST_TABLE,
        { id: insertedData!.id },
        updateData,
      );

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.name).toBe(testData.name);
      expect(data?.value).toBe(updateData.value);
    });

    it('should delete a record', async () => {
      // Insert test record
      const testData: Partial<TestRecord> = {
        name: 'test_delete',
        value: 321,
      };
      const { data: insertedData } = await service.insert<TestRecord>(TEST_TABLE, testData);
      expect(insertedData).toBeDefined();

      // Delete the record
      const { data, error } = await service.delete<TestRecord>(TEST_TABLE, {
        id: insertedData!.id,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.id).toBe(insertedData!.id);

      // Verify record is deleted
      const { data: selectData } = await service.select<TestRecord>(TEST_TABLE, {
        id: insertedData!.id,
      });
      expect(selectData).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid table name', async () => {
      const { data, error } = await service.select('invalid_table', {});
      expect(data).toBeNull();
      expect(error).toBeDefined();
    });

    it('should handle invalid query conditions', async () => {
      const { data, error } = await service.select(TEST_TABLE, {
        invalid_column: 'value',
      });
      expect(data).toBeNull();
      expect(error).toBeDefined();
    });

    it('should handle duplicate unique values', async () => {
      // Create a unique constraint
      await supabaseClient.rpc('add_unique_constraint', {
        table_name: TEST_TABLE,
        column_name: 'name',
      });

      // Insert first record
      const testData: Partial<TestRecord> = {
        name: 'unique_test',
        value: 111,
      };
      const { error: error1 } = await service.insert<TestRecord>(TEST_TABLE, testData);
      expect(error1).toBeNull();

      // Try to insert duplicate
      const { data, error } = await service.insert<TestRecord>(TEST_TABLE, testData);
      expect(data).toBeNull();
      expect(error).toBeDefined();
    });
  });

  describe('Transaction-like Operations', () => {
    it('should handle multiple operations atomically', async () => {
      const testData1: Partial<TestRecord> = {
        name: 'transaction_test_1',
        value: 111,
      };
      const testData2: Partial<TestRecord> = {
        name: 'transaction_test_2',
        value: 222,
      };

      // Perform multiple operations
      const results = await Promise.all([
        service.insert<TestRecord>(TEST_TABLE, testData1),
        service.insert<TestRecord>(TEST_TABLE, testData2),
      ]);

      expect(results.every(result => !result.error)).toBe(true);
      expect(results.every(result => result.data)).toBe(true);

      // Verify both records exist
      const { data } = await service.executeQuery<TestRecord[]>(TEST_TABLE, queryBuilder =>
        queryBuilder
          .select()
          .in('name', ['transaction_test_1', 'transaction_test_2'])
          .order('value', { ascending: true }),
      );

      expect(data).toHaveLength(2);
      expect(data![0].value).toBe(111);
      expect(data![1].value).toBe(222);
    });
  });
}); 