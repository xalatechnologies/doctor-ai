import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReportArchiveService } from './report-archive.service';
import { PDFReportModule } from '../pdf-report/pdf-report.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [ConfigModule, PDFReportModule, CacheModule],
  providers: [ReportArchiveService],
  exports: [ReportArchiveService],
})
export class ReportArchiveModule {}
