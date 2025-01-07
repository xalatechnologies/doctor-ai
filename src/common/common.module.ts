import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { MessagingModule } from './messaging/messaging.module';
import { NotificationModule } from './notification/notification.module';
import { LLMModule } from './llm/llm.module';
import { LoggerModule } from './logger/logger.module';
import { CacheModule } from './cache/cache.module';
import { CulturalContextModule } from './cultural-context/cultural-context.module';
import { TranslationModule } from './translation/translation.module';
import { PDFReportModule } from './pdf-report/pdf-report.module';
import { ReportSchedulerModule } from './report-scheduler/report-scheduler.module';
import { VisualizationModule } from './visualization/visualization.module';
import { AlertingModule } from './alerting/alerting.module';
import { ReportArchiveModule } from './report-archive/report-archive.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    MessagingModule,
    NotificationModule,
    LLMModule,
    LoggerModule,
    CacheModule,
    CulturalContextModule,
    TranslationModule,
    PDFReportModule,
    ReportSchedulerModule,
    VisualizationModule,
    AlertingModule,
    ReportArchiveModule,
  ],
  exports: [
    DatabaseModule,
    MessagingModule,
    NotificationModule,
    LLMModule,
    LoggerModule,
    CacheModule,
    CulturalContextModule,
    TranslationModule,
    PDFReportModule,
    ReportSchedulerModule,
    VisualizationModule,
    AlertingModule,
    ReportArchiveModule,
  ],
})
export class CommonModule {} 