import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { MetricsModule } from './metrics/metrics.module';
import { LLMModule } from './llm/llm.module';
import { SupabaseModule } from './supabase/supabase.module';
import { TranslationModule } from './translation/translation.module';
import { CulturalContextModule } from './cultural-context/cultural-context.module';
import { HealthModule } from './health/health.module';
import { MessagingModule } from './messaging/messaging.module';
import { LoggerModule } from './logger/logger.module';
import { CacheModule } from './cache/cache.module';
import { NotificationModule } from './notification/notification.module';
import { ReportArchiveModule } from './report-archive/report-archive.module';
import { VisualizationModule } from './visualization/visualization.module';
import { PDFReportModule } from './pdf-report/pdf-report.module';
import { AlertingModule } from './alerting/alerting.module';
import { ReportSchedulerModule } from './report-scheduler/report-scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    MetricsModule,
    LLMModule,
    SupabaseModule,
    TranslationModule,
    CulturalContextModule,
    HealthModule,
    MessagingModule,
    LoggerModule,
    CacheModule,
    NotificationModule,
    ReportArchiveModule,
    VisualizationModule,
    PDFReportModule,
    AlertingModule,
    ReportSchedulerModule,
  ],
  exports: [
    AuthModule,
    MetricsModule,
    LLMModule,
    SupabaseModule,
    TranslationModule,
    CulturalContextModule,
    HealthModule,
    MessagingModule,
    LoggerModule,
    CacheModule,
    NotificationModule,
    ReportArchiveModule,
    VisualizationModule,
    PDFReportModule,
    AlertingModule,
    ReportSchedulerModule,
  ],
})
export class CommonModule {} 