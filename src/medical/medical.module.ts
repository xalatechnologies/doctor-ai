import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { defaultLLMConfig } from './config/llm.config';
import { EmergencyController } from './controllers/emergency.controller';
import { SymptomAnalysisController } from './controllers/symptom-analysis.controller';
import { RecommendationController } from './controllers/recommendation.controller';
import { HistoryController } from './controllers/history.controller';
import { VisualizationController } from './controllers/visualization.controller';
import { EmergencyAssessmentService } from './services/emergency-assessment.service';
import { SymptomAnalysisService } from './services/symptom-analysis.service';
import { RecommendationService } from './services/recommendation.service';
import { MedicalHistoryService } from './services/medical-history.service';
import { LLMOrchestrationService } from './services/llm-orchestration.service';
import { MetricsService } from './services/metrics.service';
import { Logger } from '@nestjs/common';

// Import common services
import { PDFReportService } from '@common/pdf-report/pdf-report.service';
import { VisualizationService } from '@common/visualization/visualization.service';
import { CulturalContextService } from '@common/cultural-context/cultural-context.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        () => ({
          llms: defaultLLMConfig
        })
      ]
    })
  ],
  controllers: [
    EmergencyController,
    SymptomAnalysisController,
    RecommendationController,
    HistoryController,
    VisualizationController
  ],
  providers: [
    EmergencyAssessmentService,
    SymptomAnalysisService,
    RecommendationService,
    MedicalHistoryService,
    LLMOrchestrationService,
    MetricsService,
    PDFReportService,
    VisualizationService,
    CulturalContextService,
    Logger
  ],
  exports: [LLMOrchestrationService]
})
export class MedicalModule {} 