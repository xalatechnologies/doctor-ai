import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface QueryFilter {
  field: string;
  operator:
    | 'eq'
    | 'neq'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'like'
    | 'ilike'
    | 'is'
    | 'in'
    | 'contains'
    | 'match';
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
  private readonly logger = new Logger(SupabaseService.name);
  private _client!: SupabaseClient;

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

  async healthCheck(): Promise<boolean> {
    try {
      const { data, error } = await this._client.from('health_check').select('*').limit(1);
      if (error) throw error;
      return !!data;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Health check failed: ${error.message}`);
      } else {
        this.logger.error('Health check failed: Unknown error');
      }
      return false;
    }
  }

  async findOne<T>(table: string, filter: QueryFilter): Promise<T | null> {
    try {
      const { data, error } = await this._client
        .from(table)
        .select('*')
        .filter(filter.field, filter.operator, filter.value)
        .single();

      if (error) throw error;
      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `FindOne query failed with exception: ${error.message}`,
          { table, filter }
        );
      } else {
        this.logger.error(
          'FindOne query failed with unknown exception',
          { table, filter }
        );
      }
      throw error;
    }
  }

  async find<T>(
    table: string,
    options: QueryOptions<T> = {}
  ): Promise<{ data: T[]; count: number }> {
    try {
      let query = this._client.from(table).select(options.select || '*', { count: 'exact' });

      if (options.filters) {
        for (const filter of options.filters) {
          query = query.filter(filter.field, filter.operator, filter.value);
        }
      }

      if (options.orderBy) {
        query = query.order(options.orderBy.column as string, {
          ascending: options.orderBy.ascending,
        });
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return { data: data as T[], count: count || 0 };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Find query failed with exception: ${error.message}`, {
          table,
          options,
        });
      } else {
        this.logger.error('Find query failed with unknown exception', {
          table,
          options,
        });
      }
      throw error;
    }
  }

  async create<T>(table: string, data: T): Promise<T> {
    try {
      const { data: result, error } = await this._client
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result as T;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Create query failed with exception: ${error.message}`,
          { table, data }
        );
      } else {
        this.logger.error(
          'Create query failed with unknown exception',
          { table, data }
        );
      }
      throw error;
    }
  }

  async createMany<T>(table: string, data: T[]): Promise<T[]> {
    try {
      const { data: result, error } = await this._client
        .from(table)
        .insert(data)
        .select();

      if (error) throw error;
      return result as T[];
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `CreateMany query failed with exception: ${error.message}`,
          { table, count: data.length }
        );
      } else {
        this.logger.error(
          'CreateMany query failed with unknown exception',
          { table, count: data.length }
        );
      }
      throw error;
    }
  }

  async update<T>(
    table: string,
    filter: QueryFilter,
    data: Partial<T>
  ): Promise<void> {
    try {
      const { error } = await this._client
        .from(table)
        .update(data)
        .filter(filter.field, filter.operator, filter.value);

      if (error) throw error;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Update query failed with exception: ${error.message}`,
          { table, filter, data }
        );
      } else {
        this.logger.error(
          'Update query failed with unknown exception',
          { table, filter, data }
        );
      }
      throw error;
    }
  }

  async delete(
    table: string,
    filter: QueryFilter
  ): Promise<void> {
    try {
      const { error } = await this._client
        .from(table)
        .delete()
        .filter(filter.field, filter.operator, filter.value);

      if (error) throw error;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Delete query failed with exception: ${error.message}`,
          { table, filter }
        );
      } else {
        this.logger.error(
          'Delete query failed with unknown exception',
          { table, filter }
        );
      }
      throw error;
    }
  }

  async count(
    table: string,
    filters?: QueryFilter[]
  ): Promise<number> {
    try {
      let query = this._client.from(table).select('*', { count: 'exact', head: true });

      if (filters) {
        for (const filter of filters) {
          query = query.filter(filter.field, filter.operator, filter.value);
        }
      }

      const { count, error } = await query;
      if (error) throw error;

      return count || 0;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Count query failed with exception: ${error.message}`, {
          table,
          filters,
        });
      } else {
        this.logger.error('Count query failed with unknown exception', {
          table,
          filters,
        });
      }
      throw error;
    }
  }

  async exists(table: string, filter: QueryFilter): Promise<boolean> {
    const count = await this.count(table, [filter]);
    return count > 0;
  }
}
