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
import { AlertingService } from './services/alerting.service';
// Gateways
import { VisualizationGateway } from './gateways/visualization.gateway';
import { MonitoringGateway } from './gateways/monitoring.gateway';
// Other imports
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => ({ llms: defaultLLMConfig })],
      cache: true
    }),
    DatabaseModule
  ],
  controllers: [
    EmergencyController,
    SymptomAnalysisController,
    RecommendationController,
    HistoryController,
    VisualizationController
  ],
  providers: [
    // Core Services
    MetricsService,
    AlertingService,
    // Business Services
    EmergencyAssessmentService,
    SymptomAnalysisService,
    RecommendationService,
    MedicalHistoryService,
    LLMOrchestrationService,
    TranslationService,
    VisualizationService,
    PushNotificationService,
    // Gateways
    VisualizationGateway,
    MonitoringGateway
  ],
  exports: [
    // Core Services
    MetricsService,
    AlertingService,
    // Business Services
    EmergencyAssessmentService,
    SymptomAnalysisService,
    RecommendationService,
    MedicalHistoryService,
    LLMOrchestrationService,
    TranslationService,
    VisualizationService,
    // Gateways
    VisualizationGateway,
    MonitoringGateway
  ]
})
export class MedicalModule {} 