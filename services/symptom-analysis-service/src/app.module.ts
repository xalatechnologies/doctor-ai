import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MessagingModule, LLMModule, TranslationModule, MetricsModule, SupabaseModule } from '@app/common';
import { SymptomAnalysisService } from './services/symptom-analysis.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MessagingModule,
    LLMModule,
    TranslationModule,
    MetricsModule,
    SupabaseModule,
  ],
  providers: [SymptomAnalysisService],
  exports: [SymptomAnalysisService],
})
export class AppModule {} 