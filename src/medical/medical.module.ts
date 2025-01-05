import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { defaultLLMConfig } from './config/llm.config';
// Controllers
import { EmergencyController } from './controllers/emergency.controller';
import { SymptomAnalysisController } from './controllers/symptom-analysis.controller';
import { RecommendationController } from './controllers/recommendation.controller';
import { HistoryController } from './controllers/history.controller';
import { VisualizationController } from './controllers/visualization.controller';
// Services
import { EmergencyAssessmentService } from './services/emergency-assessment.service';
import { SymptomAnalysisService } from './services/symptom-analysis.service';
import { RecommendationService } from './services/recommendation.service';
import { MedicalHistoryService } from './services/medical-history.service';
import { LLMOrchestrationService } from './services/llm-orchestration.service';
import { TranslationService } from './services/translation.service';
import { VisualizationService } from './services/visualization.service';
import { PushNotificationService } from './services/push-notification.service';
import { MetricsService } from './services/metrics.service';
import { PDFReportService } from './services/pdf-report.service';
import { ReportArchiveService } from './services/report-archive.service';

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
    TranslationService,
    VisualizationService,
    PushNotificationService,
    MetricsService,
    PDFReportService,
    ReportArchiveService,
    Logger
  ],
  exports: [LLMOrchestrationService]
})
export class MedicalModule {} 