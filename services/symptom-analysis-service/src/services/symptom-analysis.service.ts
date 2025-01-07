import { Injectable, Inject, InternalServerErrorException, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AnalyzeSymptomDto } from '../dto/analyze-symptom.dto';
import { Severity, SymptomAnalysis, EmergencyAnalysis } from '../interfaces/symptom.interface';
import { RabbitMQService } from '@app/common/messaging';
import { MedicalTerminology } from '../interfaces/medical-terminology.interface';
import { MedicalReportInput, SymptomInputDto } from '../dto/medical-report-input.dto';
import { MedicalReport, SymptomAssessment, VitalSignsAssessment } from '../interfaces/medical-report.interface';
import { SymptomRiskInput } from '../dto/symptom-risk-input.dto';
import { RiskAssessmentResponseDto } from '../dto/risk-assessment-response.dto';
import { LLMOrchestrationService } from '@app/common/llm';
import { MetricsService } from '@app/common/metrics';
import { TranslationService } from '@app/common/translation';

type EmergencyAssessmentData = {
  assessment: {
    category: 'CARDIAC' | 'RESPIRATORY' | 'NEUROLOGICAL' | string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    immediateActions: string[];
  };
  patientData: {
    medications?: string[];
  };
};

@Injectable()
export class SymptomAnalysisService {
  private readonly logger = new Logger(SymptomAnalysisService.name);

  constructor(
    @Inject('RABBITMQ_SERVICE') private readonly clientProxy: ClientProxy,
    private readonly llmOrchestrationService: LLMOrchestrationService,
    private readonly metricsService: MetricsService,
    private readonly translationService: TranslationService,
    @Inject('MEDICAL_TERMINOLOGY') private readonly medicalTerminology: MedicalTerminology,
    private readonly messagingService: RabbitMQService
  ) {}

  async analyzeSymptom(symptomDto: AnalyzeSymptomDto): Promise<SymptomAnalysis> {
    try {
      const symptomId = `SYM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const severity: Severity = {
        level: symptomDto.severityLevel,
        description: this.getSeverityDescription(symptomDto.severityLevel)
      };

      const analysis: SymptomAnalysis = {
        symptomId,
        primarySymptom: symptomDto.primarySymptom,
        secondarySymptoms: symptomDto.secondarySymptoms || [],
        severity,
        possibleConditions: await this.analyzePossibleConditions(symptomDto),
        recommendations: await this.generateRecommendations(symptomDto),
        urgencyLevel: this.calculateUrgencyLevel(symptomDto),
        requiredSpecialties: await this.determineRequiredSpecialties(symptomDto),
        followUpActions: await this.determineFollowUpActions(symptomDto),
        timestamp: new Date().toISOString()
      };

      // Emit the analysis result
      await this.messagingService.emit('symptom.analyzed', {
        analysis,
        originalData: symptomDto
      });

      return analysis;
    } catch (error) {
      this.logger.error(`Error analyzing symptom: ${error.message}`);
      throw new InternalServerErrorException('Failed to analyze symptom');
    }
  }

  private getSeverityDescription(level: number): string {
    if (level >= 7) return 'Severe';
    if (level >= 4) return 'Moderate';
    return 'Mild';
  }

  private async analyzePossibleConditions(symptomDto: AnalyzeSymptomDto): Promise<string[]> {
    const analysis = await this.llmOrchestrationService.analyzeText({
      text: `${symptomDto.primarySymptom} with severity ${symptomDto.severityLevel}`,
      context: 'possible_conditions'
    });
    return analysis.differentials || [];
  }

  private calculateUrgencyLevel(symptomDto: AnalyzeSymptomDto): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (symptomDto.severityLevel >= 7 || symptomDto.painLevel >= 8) return 'HIGH';
    if (symptomDto.severityLevel >= 4 || symptomDto.painLevel >= 5) return 'MEDIUM';
    return 'LOW';
  }

  private async determineRequiredSpecialties(symptomDto: AnalyzeSymptomDto): Promise<string[]> {
    const analysis = await this.llmOrchestrationService.analyzeText({
      text: `${symptomDto.primarySymptom} with history of ${symptomDto.patientHistory || 'none'}`,
      context: 'required_specialties'
    });
    return analysis.differentials?.filter((d: string) => d.includes('specialist') || d.includes('ologist')) || [];
  }

  private async determineFollowUpActions(symptomDto: AnalyzeSymptomDto): Promise<string[]> {
    const urgencyLevel = this.calculateUrgencyLevel(symptomDto);
    if (urgencyLevel === 'HIGH') {
      return ['Seek immediate medical attention', 'Contact emergency services'];
    }
    const analysis = await this.llmOrchestrationService.analyzeText({
      text: `${symptomDto.primarySymptom} with severity ${symptomDto.severityLevel}`,
      context: 'follow_up_actions'
    });
    return analysis.followUp || [];
  }

  private async generateRecommendations(symptomDto: AnalyzeSymptomDto): Promise<string[]> {
    const urgencyLevel = this.calculateUrgencyLevel(symptomDto);
    const recommendations: string[] = [];

    if (urgencyLevel === 'HIGH') {
      recommendations.push('Seek immediate medical attention');
      recommendations.push('Contact emergency services if symptoms worsen');
    }

    const analysis = await this.llmOrchestrationService.analyzeText({
      text: `${symptomDto.primarySymptom} with severity ${symptomDto.severityLevel}`,
      context: 'recommendations'
    });

    return [...recommendations, ...(analysis.immediateActions || [])];
  }

  async handleEmergencyAssessment(data: EmergencyAssessmentData): Promise<void> {
    try {
      const emergencyAnalysis: EmergencyAnalysis = {
        timestamp: new Date().toISOString(),
        emergencyCategory: data.assessment.category,
        detailedRecommendations: data.assessment.immediateActions,
        specialistReferrals: [],
        followUpPlan: {
          immediateActions: data.assessment.immediateActions,
          shortTermFollowUp: 'Schedule follow-up within 24 hours',
          longTermMonitoring: 'Regular monitoring as advised by specialist'
        }
      };

      await this.messagingService.emit('emergency.assessment.completed', {
        analysis: emergencyAnalysis,
        patientData: data.patientData
      });
    } catch (error) {
      this.logger.error(`Error handling emergency assessment: ${error.message}`);
      throw new InternalServerErrorException('Failed to process emergency assessment');
    }
  }

  async generateReport(input: MedicalReportInput): Promise<MedicalReport> {
    try {
      const analysis = await this.llmOrchestrationService.analyzeText({
        text: input.symptoms.map(s => s.description).join(', '),
        context: 'medical_report'
      });

      const urgencyLevel = this.determineUrgencyFromSymptoms(input.symptoms);

      const symptoms: SymptomAssessment[] = input.symptoms.map(s => ({
        ...s,
        interpretation: analysis.analysis || '',
        riskFactors: analysis.risks || []
      }));

      const vitalSigns: VitalSignsAssessment = {
        ...input.vitalSigns,
        summary: analysis.vitalSignsSummary || '',
        findings: analysis.abnormalFindings || [],
        requiresAttention: analysis.isUrgent || false
      };

      return {
        reportId: `REP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        patientId: input.patientId,
        symptoms,
        vitalSigns,
        diagnosis: {
          primaryDiagnosis: analysis.primaryDiagnosis || '',
          differentialDiagnoses: analysis.differentials || [],
          confidence: analysis.confidence || 0
        },
        recommendations: analysis.immediateActions || [],
        followUpPlan: analysis.followUp || [],
        urgencyLevel
      };
    } catch (error) {
      this.logger.error(`Error generating medical report: ${error.message}`);
      throw new InternalServerErrorException('Failed to generate medical report');
    }
  }

  private determineUrgencyFromSymptoms(symptoms: SymptomInputDto[]): 'LOW' | 'MEDIUM' | 'HIGH' {
    const maxSeverity = Math.max(...symptoms.map(s => s.severityLevel || 0));
    if (maxSeverity >= 7) return 'HIGH';
    if (maxSeverity >= 4) return 'MEDIUM';
    return 'LOW';
  }

  async assessRisk(input: SymptomRiskInput): Promise<RiskAssessmentResponseDto> {
    try {
      const analysis = await this.llmOrchestrationService.analyzeText({
        text: `${input.symptoms.join(', ')} with context: ${input.medicalHistory || 'none'}`,
        context: 'risk_assessment'
      });

      const riskLevel = this.determineUrgencyFromSymptoms([{
        description: input.symptoms.join(', '),
        severity: input.severityLevel,
        duration: 'unknown',
        onset: 'unknown',
        severityLevel: input.severityLevel
      }]);

      return {
        riskLevel,
        riskFactors: analysis.risks || [],
        recommendations: analysis.immediateActions || [],
        requiresEmergencyCare: analysis.isUrgent || false,
        specialistReferral: (analysis.differentials?.length || 0) > 2
      };
    } catch (error) {
      this.logger.error(`Error assessing risk: ${error.message}`);
      throw new InternalServerErrorException('Failed to assess risk');
    }
  }
} 