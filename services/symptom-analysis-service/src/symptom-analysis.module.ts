import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SymptomAnalysisService } from './services/symptom-analysis.service';
import { SymptomAnalysisController } from './controllers/symptom-analysis.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [SymptomAnalysisController],
  providers: [SymptomAnalysisService],
  exports: [SymptomAnalysisService],
})
export class SymptomAnalysisModule {} 