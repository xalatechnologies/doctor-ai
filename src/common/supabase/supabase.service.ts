import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private _client: SupabaseClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration is missing');
    }

    this._client = createClient(supabaseUrl, supabaseKey);
  }

  async onModuleInit(): Promise<void> {
    // Verify connection
    try {
      await this._client.auth.getSession();
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      throw error;
    }
  }

  get client(): SupabaseClient {
    if (!this._client) {
      throw new Error('Supabase client is not initialized');
    }
    return this._client;
  }

  async executeQuery<T>(
    tableName: string,
    query: any,
    operation: string,
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await query;
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('supabase', operation, duration);
      return result.data;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('supabase', `${operation}_error`, duration);
      throw error;
    }
  }

  async select<T>(
    tableName: string,
    query: any = {},
  ): Promise<T[]> {
    return this.executeQuery<T[]>(
      tableName,
      this.client.from(tableName).select(query),
      'select',
    );
  }

  async insert<T>(
    tableName: string,
    data: Partial<T>,
  ): Promise<T> {
    return this.executeQuery<T>(
      tableName,
      this.client.from(tableName).insert(data).single(),
      'insert',
    );
  }

  async update<T>(
    tableName: string,
    query: any,
    data: Partial<T>,
  ): Promise<T> {
    return this.executeQuery<T>(
      tableName,
      this.client.from(tableName).update(data).match(query).single(),
      'update',
    );
  }

  async delete<T>(
    tableName: string,
    query: any,
  ): Promise<T> {
    return this.executeQuery<T>(
      tableName,
      this.client.from(tableName).delete().match(query).single(),
      'delete',
    );
  }

  async upsert<T>(
    tableName: string,
    data: Partial<T>,
    onConflict: string,
  ): Promise<T> {
    return this.executeQuery<T>(
      tableName,
      this.client
        .from(tableName)
        .upsert(data, { onConflict })
        .single(),
      'upsert',
    );
  }
}
