import { Module } from '@nestjs/common';
import { SymptomAnalysisModule } from './symptom-analysis-service/src/symptom-analysis.module';
@Module({
  imports: [
    SymptomAnalysisModule,
  ],
  exports: [
    SymptomAnalysisModule,
  ],
})
export class ServicesModule {}
