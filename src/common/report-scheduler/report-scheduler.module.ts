import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReportSchedulerService } from './report-scheduler.service';
import { PDFReportModule } from '../pdf-report/pdf-report.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [ConfigModule, PDFReportModule, NotificationModule],
  providers: [ReportSchedulerService],
  exports: [ReportSchedulerService],
})
export class ReportSchedulerModule {}
