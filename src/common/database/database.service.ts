import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);
  private client!: SupabaseClient;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      await this.initializeClient();
      await this.validateConnection();
      this.logger.log('Database connection established successfully');
    } catch (error) {
      this.logger.error('Failed to initialize database connection:', error);
      throw error;
    }
  }

  private async initializeClient(): Promise<void> {
    const url = this.configService.getOrThrow<string>('SUPABASE_URL');
    const key = this.configService.getOrThrow<string>('SUPABASE_KEY');

    this.client = createClient(url, key, {
      auth: {
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
    });
  }

  private async validateConnection(): Promise<void> {
    try {
      const { error } = await this.client.from('health_check').select('count');
      if (error) throw error;
    } catch (error) {
      this.logger.error('Database connection validation failed:', error);
      throw error;
    }
  }

  getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error('Database client not initialized');
    }
    return this.client;
  }

  async executeQuery<T>(
    tableName: string,
    query: (queryBuilder: any) => any,
  ): Promise<{ data: T | null; error: Error | null }> {
    try {
      const result = await query(this.client.from(tableName));
      return { data: result.data, error: result.error };
    } catch (error) {
      this.logger.error(
        `Failed to execute query on table ${tableName}:`,
        error,
      );
      return { data: null, error: error as Error };
    }
  }

  async insert<T>(
    tableName: string,
    data: Partial<T>,
  ): Promise<{ data: T | null; error: Error | null }> {
    return this.executeQuery<T>(tableName, (queryBuilder) =>
      queryBuilder.insert(data).select().single(),
    );
  }

  async update<T>(
    tableName: string,
    match: Partial<T>,
    data: Partial<T>,
  ): Promise<{ data: T | null; error: Error | null }> {
    return this.executeQuery<T>(tableName, (queryBuilder) =>
      queryBuilder.update(data).match(match).select().single(),
    );
  }

  async select<T>(
    tableName: string,
    match: Partial<T>,
  ): Promise<{ data: T | null; error: Error | null }> {
    return this.executeQuery<T>(tableName, (queryBuilder) =>
      queryBuilder.select().match(match).single(),
    );
  }

  async delete<T>(
    tableName: string,
    match: Partial<T>,
  ): Promise<{ data: T | null; error: Error | null }> {
    return this.executeQuery<T>(tableName, (queryBuilder) =>
      queryBuilder.delete().match(match).select().single(),
    );
  }
}
