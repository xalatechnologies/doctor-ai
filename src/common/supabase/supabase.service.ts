import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface QueryFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is' | 'in' | 'contains' | 'match';
  value: any;
}

export interface QueryOptions<T> {
  select?: string;
  filters?: QueryFilter[];
  orderBy?: {
    column: keyof T;
    ascending?: boolean;
  };
  limit?: number;
  offset?: number;
}

@Injectable()
export class SupabaseService implements OnModuleInit {
  private _client: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    this._client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: true,
      },
      db: {
        schema: 'public',
      },
    });

    this.logger.log('Supabase client initialized');
  }

  get client(): SupabaseClient {
    if (!this._client) {
      throw new Error('Supabase client not initialized');
    }
    return this._client;
  }

  async healthCheck(): Promise<{ isHealthy: boolean; responseTime: number }> {
    const startTime = Date.now();
    try {
      const { error } = await this.client.rpc('healthcheck');
      const responseTime = Date.now() - startTime;

      if (error) {
        this.logger.error(`Health check failed: ${error.message}`);
        return { isHealthy: false, responseTime };
      }

      return { isHealthy: true, responseTime };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      return { isHealthy: false, responseTime: Date.now() - startTime };
    }
  }

  async findOne<T>(table: string, filter: QueryFilter): Promise<T | null> {
    try {
      const query = this.client.from(table).select('*');
      const { data, error } = await this.applyFilter(query, filter).single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        this.logger.error(`FindOne query failed: ${error.message}`, { table, error });
        throw error;
      }

      return data as T;
    } catch (error) {
      this.logger.error(`FindOne query failed with exception: ${error.message}`, {
        table,
        error,
      });
      throw error;
    }
  }

  async find<T>(table: string, options: QueryOptions<T> = {}): Promise<{ data: T[]; count: number }> {
    try {
      let query = this.client.from(table).select(options.select || '*', { count: 'exact' });

      if (options.filters?.length) {
        options.filters.forEach(filter => {
          query = this.applyFilter(query, filter);
        });
      }

      if (options.orderBy) {
        query = query.order(options.orderBy.column as string, {
          ascending: options.orderBy.ascending ?? true,
        });
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        this.logger.error(`Find query failed: ${error.message}`, { table, error });
        throw error;
      }

      return { data: data as T[], count: count || 0 };
    } catch (error) {
      this.logger.error(`Find query failed with exception: ${error.message}`, {
        table,
        error,
      });
      throw error;
    }
  }

  async create<T>(table: string, data: Partial<T>): Promise<T> {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        this.logger.error(`Create query failed: ${error.message}`, { table, error });
        throw error;
      }

      return result as T;
    } catch (error) {
      this.logger.error(`Create query failed with exception: ${error.message}`, {
        table,
        error,
      });
      throw error;
    }
  }

  async createMany<T>(table: string, data: Partial<T>[]): Promise<T[]> {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .insert(data)
        .select();

      if (error) {
        this.logger.error(`CreateMany query failed: ${error.message}`, { table, error });
        throw error;
      }

      return result as T[];
    } catch (error) {
      this.logger.error(`CreateMany query failed with exception: ${error.message}`, {
        table,
        error,
      });
      throw error;
    }
  }

  async update<T>(table: string, filter: QueryFilter, data: Partial<T>): Promise<T> {
    try {
      const query = this.client.from(table).update(data);
      const { data: result, error } = await this.applyFilter(query, filter).select().single();

      if (error) {
        this.logger.error(`Update query failed: ${error.message}`, { table, error });
        throw error;
      }

      return result as T;
    } catch (error) {
      this.logger.error(`Update query failed with exception: ${error.message}`, {
        table,
        error,
      });
      throw error;
    }
  }

  async delete<T>(table: string, filter: QueryFilter): Promise<T> {
    try {
      const query = this.client.from(table).delete();
      const { data: result, error } = await this.applyFilter(query, filter).select().single();

      if (error) {
        this.logger.error(`Delete query failed: ${error.message}`, { table, error });
        throw error;
      }

      return result as T;
    } catch (error) {
      this.logger.error(`Delete query failed with exception: ${error.message}`, {
        table,
        error,
      });
      throw error;
    }
  }

  async count(table: string, filter?: QueryFilter): Promise<number> {
    try {
      let query = this.client.from(table).select('*', { count: 'exact', head: true });

      if (filter) {
        query = this.applyFilter(query, filter);
      }

      const { count, error } = await query;

      if (error) {
        this.logger.error(`Count query failed: ${error.message}`, { table, error });
        throw error;
      }

      return count || 0;
    } catch (error) {
      this.logger.error(`Count query failed with exception: ${error.message}`, {
        table,
        error,
      });
      throw error;
    }
  }

  async exists(table: string, filter: QueryFilter): Promise<boolean> {
    const count = await this.count(table, filter);
    return count > 0;
  }

  private applyFilter(query: any, filter: QueryFilter) {
    switch (filter.operator) {
      case 'eq':
        return query.eq(filter.field, filter.value);
      case 'neq':
        return query.neq(filter.field, filter.value);
      case 'gt':
        return query.gt(filter.field, filter.value);
      case 'gte':
        return query.gte(filter.field, filter.value);
      case 'lt':
        return query.lt(filter.field, filter.value);
      case 'lte':
        return query.lte(filter.field, filter.value);
      case 'like':
        return query.like(filter.field, filter.value);
      case 'ilike':
        return query.ilike(filter.field, filter.value);
      case 'is':
        return query.is(filter.field, filter.value);
      case 'in':
        return query.in(filter.field, filter.value);
      case 'contains':
        return query.contains(filter.field, filter.value);
      case 'match':
        return query.match(filter.field, filter.value);
      default:
        return query;
    }
  }
} 