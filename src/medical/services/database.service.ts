import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class DatabaseService {
  private readonly supabase: SupabaseClient;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly configService: ConfigService) {
    this.logger.debug('Initializing DatabaseService');
    const url = this.configService.getOrThrow<string>('SUPABASE_URL');
    const key = this.configService.getOrThrow<string>('SUPABASE_KEY');
    this.logger.debug(`Supabase URL: ${url.substring(0, 10)}...`);
    
    this.supabase = createClient(url, key);
    this.logger.debug('DatabaseService initialized');
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.from('health_checks').select('count');
      return !error;
    } catch (err) {
      return false;
    }
  }
}