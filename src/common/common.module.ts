import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { MetricsModule } from './metrics/metrics.module';
import { TranslationModule } from './translation/translation.module';
import { LLMModule } from './llm/llm.module';
import { MessagingModule } from './messaging/messaging.module';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from './cache/cache.module';
import { CulturalContextModule } from './cultural-context/cultural-context.module';
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
    SupabaseModule,
    MetricsModule,
    TranslationModule,
    LLMModule,
    MessagingModule,
    AuthModule,
    CacheModule,
    CulturalContextModule,
    NotificationModule,
    ReportArchiveModule,
    VisualizationModule,
    PDFReportModule,
    AlertingModule,
    ReportSchedulerModule,
  ],
  exports: [
    SupabaseModule,
    MetricsModule,
    TranslationModule,
    LLMModule,
    MessagingModule,
    AuthModule,
    CacheModule,
    CulturalContextModule,
    NotificationModule,
    ReportArchiveModule,
    VisualizationModule,
    PDFReportModule,
    AlertingModule,
    ReportSchedulerModule,
  ],
})
export class CommonModule {}
