import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client!: SupabaseClient;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.client = createClient(
      this.configService.getOrThrow<string>('SUPABASE_URL'),
      this.configService.getOrThrow<string>('SUPABASE_KEY'),
      {
        auth: {
          persistSession: false,
        },
      },
    );
  }

  async query<T = any>(
    table: string,
    query: {
      select?: string;
      eq?: Record<string, any>;
      in?: Record<string, any[]>;
      gt?: Record<string, any>;
      lt?: Record<string, any>;
      order?: { column: string; ascending?: boolean };
      limit?: number;
      offset?: number;
    },
  ): Promise<T[]> {
    let queryBuilder = this.client.from(table).select(query.select || '*');

    if (query.eq) {
      Object.entries(query.eq).forEach(([column, value]) => {
        queryBuilder = queryBuilder.eq(column, value);
      });
    }

    if (query.in) {
      Object.entries(query.in).forEach(([column, values]) => {
        queryBuilder = queryBuilder.in(column, values);
      });
    }

    if (query.gt) {
      Object.entries(query.gt).forEach(([column, value]) => {
        queryBuilder = queryBuilder.gt(column, value);
      });
    }

    if (query.lt) {
      Object.entries(query.lt).forEach(([column, value]) => {
        queryBuilder = queryBuilder.lt(column, value);
      });
    }

    if (query.order) {
      queryBuilder = queryBuilder.order(query.order.column, {
        ascending: query.order.ascending ?? true,
      });
    }

    if (query.limit) {
      queryBuilder = queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder = queryBuilder.range(query.offset, query.offset + (query.limit || 10) - 1);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw error;
    }

    return data as T[];
  }

  async insert<T = any>(
    table: string,
    data: Record<string, any> | Record<string, any>[],
  ): Promise<T[]> {
    const { data: result, error } = await this.client
      .from(table)
      .insert(data)
      .select();

    if (error) {
      throw error;
    }

    return result as T[];
  }

  async update<T = any>(
    table: string,
    query: {
      eq?: Record<string, any>;
      in?: Record<string, any[]>;
    },
    data: Record<string, any>,
  ): Promise<T[]> {
    let queryBuilder = this.client.from(table).update(data);

    if (query.eq) {
      Object.entries(query.eq).forEach(([column, value]) => {
        queryBuilder = queryBuilder.eq(column, value);
      });
    }

    if (query.in) {
      Object.entries(query.in).forEach(([column, values]) => {
        queryBuilder = queryBuilder.in(column, values);
      });
    }

    const { data: result, error } = await queryBuilder.select();

    if (error) {
      throw error;
    }

    return result as T[];
  }

  async delete(
    table: string,
    query: {
      eq?: Record<string, any>;
      in?: Record<string, any[]>;
    },
  ): Promise<void> {
    let queryBuilder = this.client.from(table).delete();

    if (query.eq) {
      Object.entries(query.eq).forEach(([column, value]) => {
        queryBuilder = queryBuilder.eq(column, value);
      });
    }

    if (query.in) {
      Object.entries(query.in).forEach(([column, values]) => {
        queryBuilder = queryBuilder.in(column, values);
      });
    }

    const { error } = await queryBuilder;

    if (error) {
      throw error;
    }
  }

  async transaction<T>(callback: (client: SupabaseClient) => Promise<T>): Promise<T> {
    return await callback(this.client);
  }
} 