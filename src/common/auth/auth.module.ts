import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { MetricsModule } from '../metrics/metrics.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [ConfigModule, SupabaseModule, MetricsModule],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
