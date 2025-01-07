import { Module } from '@nestjs/common';
import { TreatmentModule } from './treatment-service/src/treatment.module';
import { EmergencyModule } from './emergency-service/src/emergency.module';
import { SymptomAnalysisModule } from './symptom-analysis-service/src/symptom-analysis.module';
@Module({
  imports: [
    EmergencyModule,
    SymptomAnalysisModule,
    TreatmentModule,
  ],
  exports: [
    EmergencyModule,
    SymptomAnalysisModule,
    TreatmentModule,
  ],
})
export class ServicesModule {}
