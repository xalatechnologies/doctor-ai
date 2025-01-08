import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SymptomAnalysisService } from './services/symptom-analysis.service';
import { SymptomAnalysisController } from './controllers/symptom-analysis.controller';
import {
  MessagingModule,
  TranslationModule,
  MetricsModule,
  SupabaseModule,
  LLMModule,
} from '@app/common';

@Module({
  imports: [
    ConfigModule,
    MessagingModule,
    LLMModule,
    TranslationModule,
    MetricsModule,
    SupabaseModule,
  ],
  controllers: [SymptomAnalysisController],
  providers: [SymptomAnalysisService],
  exports: [SymptomAnalysisService],
})
export class SymptomAnalysisModule {} 