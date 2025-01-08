import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PDFReportService } from './pdf-report.service';
import { CulturalContextModule } from '../cultural-context/cultural-context.module';

@Module({
  imports: [ConfigModule, CulturalContextModule],
  providers: [PDFReportService],
  exports: [PDFReportService],
})
export class PDFReportModule {}
