import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { LoggerService, MetricsService, RedisService } from '@app/common';
import {
  SymptomRiskInput,
  RiskAssessmentResponse,
  RiskLevel,
  ConfidenceLevel,
  RiskFactor,
  CategoryRiskAssessment,
  TimeFrame,
  RiskCategory,
  RiskProjection
} from '../interfaces/risk-assessment.interface';
import { LLMOrchestrationService } from './llm-orchestration.service';
import { TranslationService } from './translation.service';
import {
  MedicalReport,
  VitalSignsAssessment,
  SymptomAssessment,
  DiagnosticImpression,
  TreatmentPlan
} from '../interfaces/medical-report.interface';
import {
  MedicalReportInput,
  VitalSigns,
  SymptomDetail,
  ReportType,
  SymptomSeverity
} from '../dto/medical-report-input.dto';
import { MedicalTerminology } from '../interfaces/medical-terminology.interface';
import {
  FHIRBundle,
  FHIRObservation,
  FHIRRiskAssessment,
  EHRExportOptions
} from '../interfaces/fhir-export.interface';
import { EncryptionService } from './encryption.service';

@Injectable()
export class SymptomAnalysisService {
  private readonly riskScores: Record<RiskLevel, number> = {
    [RiskLevel.VERY_HIGH]: 4,
    [RiskLevel.HIGH]: 3,
    [RiskLevel.MODERATE]: 2,
    [RiskLevel.LOW]: 1,
    [RiskLevel.VERY_LOW]: 0
  };

  constructor(
    @Inject('RABBITMQ_SERVICE') private readonly rabbitMQService: ClientProxy,
    private readonly llmOrchestrationService: LLMOrchestrationService,
    private readonly logger: LoggerService,
    private readonly metrics: MetricsService,
    private readonly redis: RedisService,
    private readonly translationService: TranslationService,
    @Inject('MEDICAL_TERMINOLOGY') private readonly medicalTerminology: MedicalTerminology,
    private readonly encryptionService: EncryptionService
  ) {}

  async assessRisk(data: SymptomRiskInput): Promise<RiskAssessmentResponse> {
    try {
      // Generate cache key based on input data
      const cacheKey = this.redis.generateKey(
        'risk-assessment',
        data.primarySymptom.name,
        data.primarySymptom.severity.toString(),
        data.riskCategories.join('-')
      );

      // Try to get cached result
      return await this.redis.getOrSet(
        cacheKey,
        async () => {
          // Start provider latency timer
          const endTimer = this.metrics.startProviderTimer('risk-assessment');

          try {
            // Encrypt sensitive input data
            const encryptedData = this.encryptionService.encryptObject(data);
            this.logger.info(`Performing risk assessment for: ${encryptedData.primarySymptom.name}`, {
              service: 'SymptomAnalysisService'
            });

            // Generate assessment ID
            const assessmentId = `RISK-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

            // Perform category-specific risk assessments
            const categoryAssessments = await Promise.all(
              data.riskCategories.map(category => this.assessCategoryRisk(category, data))
            );

            // Determine highest risk level
            const highestRiskLevel = this.determineHighestRisk(categoryAssessments);

            // Identify priority categories
            const priorityCategories = this.identifyPriorityCategories(categoryAssessments);

            // Generate lifestyle recommendations
            const lifestyleRecommendations = this.generateLifestyleRecommendations(data, categoryAssessments);

            // Determine specialist referrals
            const specialistReferrals = this.determineSpecialistReferrals(categoryAssessments);

            // Determine follow-up timeframe
            const followUpTimeframe = this.determineRiskFollowUp(highestRiskLevel);

            // Check if emergency care is needed
            const requiresEmergencyCare = this.checkEmergencyRisk(categoryAssessments);

            // Calculate overall confidence
            const overallConfidence = this.calculateRiskConfidence(categoryAssessments);

            // Publish assessment results if needed
            try {
              await this.rabbitMQService.emit('risk.assessment.completed', {
                assessmentId,
                highestRiskLevel,
                requiresEmergencyCare
              });
            } catch (error) {
              this.logger.error(`Failed to publish risk assessment result: ${error.message}`, {
                error,
                service: 'SymptomAnalysisService'
              });
              this.metrics.trackError('rabbitmq_publish', 'SymptomAnalysisService');
              // Continue execution as the assessment is still valid
            }

            // Record metrics
            endTimer();
            this.metrics.trackCacheHit('risk-assessment');

            // Encrypt sensitive data in response
            const response = {
              assessmentId,
              timestamp: new Date(),
              categoryAssessments,
              highestRiskLevel,
              priorityCategories,
              followUpTimeframe,
              requiresEmergencyCare,
              overallConfidence,
              lifestyleRecommendations,
              specialistReferrals
            };

            return this.encryptionService.encryptObject(response);
          } catch (error) {
            this.metrics.trackProviderError('risk-assessment', error.name);
            throw error;
          }
        },
        1800 // 30 minutes cache TTL
      );
    } catch (error) {
      this.logger.error(`Error in risk assessment: ${error.message}`, {
        error,
        service: 'SymptomAnalysisService'
      });
      this.metrics.trackError('risk_assessment', 'SymptomAnalysisService');
      throw error;
    }
  }

  // ... rest of the service implementation ...
} 