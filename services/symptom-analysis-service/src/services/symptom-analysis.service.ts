import { Injectable, Inject, InternalServerErrorException, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
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
import { MetricsService } from './metrics.service';
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
  private readonly logger = new Logger(SymptomAnalysisService.name);
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
    private readonly metricsService: MetricsService,
    private readonly translationService: TranslationService,
    @Inject('MEDICAL_TERMINOLOGY') private readonly medicalTerminology: MedicalTerminology,
    private readonly encryptionService: EncryptionService
  ) {}

  async assessRisk(data: SymptomRiskInput): Promise<RiskAssessmentResponse> {
    try {
      // Encrypt sensitive input data
      const encryptedData = this.encryptionService.encryptObject(data);
      this.logger.log(`Performing risk assessment for: ${encryptedData.primarySymptom.name}`);

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
        this.logger.error(`Failed to publish risk assessment result: ${error.message}`);
        // Continue execution as the assessment is still valid
      }

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
      this.logger.error(`Error in risk assessment: ${error.message}`);
      throw error;
    }
  }

  private async assessCategoryRisk(
    category: RiskCategory,
    data: SymptomRiskInput
  ): Promise<CategoryRiskAssessment> {
    // Get risk factors for this category
    const riskFactors = this.identifyCategoryRiskFactors(category, data);
    
    // Calculate overall risk
    const overallRisk = this.calculateCategoryRisk(riskFactors);
    
    // Generate projections if requested
    const projections = data.includeLongTermRisk 
      ? this.generateRiskProjections(category, riskFactors, data)
      : [];

    return {
      category,
      overallRisk,
      confidence: this.calculateCategoryConfidence(category, data),
      riskFactors,
      projections,
      keyFindings: this.extractRiskFindings(category, riskFactors, data),
      warningSignsToMonitor: this.getCategoryWarningSignsToMonitor(category)
    };
  }

  private identifyCategoryRiskFactors(
    category: RiskCategory,
    data: SymptomRiskInput
  ): RiskFactor[] {
    const factors: RiskFactor[] = [];

    switch (category) {
      case RiskCategory.CARDIOVASCULAR:
        factors.push(...this.identifyCardiovascularRiskFactors(data));
        break;
      case RiskCategory.RESPIRATORY:
        factors.push(...this.identifyRespiratoryRiskFactors(data));
        break;
      // Add other categories
    }

    return factors;
  }

  private identifyCardiovascularRiskFactors(data: SymptomRiskInput): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // Check blood pressure
    const systolic = data.vitalSigns?.bloodPressureSystolic;
    if (systolic !== undefined && systolic > 140) {
      factors.push({
        name: 'Elevated Blood Pressure',
        impact: RiskLevel.HIGH,
        modifiable: true,
        recommendations: [
          'Regular blood pressure monitoring',
          'Medication compliance',
          'Dietary sodium reduction',
          'Regular exercise'
        ]
      });
    }

    // Check lifestyle factors
    const smokingPerDay = data.lifestyleFactors?.smokingPerDay;
    if (smokingPerDay !== undefined && smokingPerDay > 0) {
      factors.push({
        name: 'Active Smoking',
        impact: RiskLevel.VERY_HIGH,
        modifiable: true,
        recommendations: [
          'Smoking cessation program',
          'Nicotine replacement therapy',
          'Behavioral counseling'
        ]
      });
    }

    // Check family history
    const familyConditions = data.familyHistory?.familyConditions;
    if (familyConditions?.includes('heart disease')) {
      factors.push({
        name: 'Family History of Heart Disease',
        impact: RiskLevel.HIGH,
        modifiable: false,
        recommendations: [
          'Regular cardiac screening',
          'Early preventive measures',
          'Genetic counseling consideration'
        ]
      });
    }

    return factors;
  }

  private identifyRespiratoryRiskFactors(data: SymptomRiskInput): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // Check oxygen saturation
    const oxygenSaturation = data.vitalSigns?.oxygenSaturation;
    if (oxygenSaturation !== undefined && oxygenSaturation < 95) {
      factors.push({
        name: 'Reduced Oxygen Saturation',
        impact: RiskLevel.HIGH,
        modifiable: true,
        recommendations: [
          'Regular oxygen monitoring',
          'Pulmonary function testing',
          'Respiratory therapy consultation'
        ]
      });
    }

    // Check smoking status
    const smokingPerDay = data.lifestyleFactors?.smokingPerDay;
    if (smokingPerDay !== undefined && smokingPerDay > 0) {
      factors.push({
        name: 'Active Smoking',
        impact: RiskLevel.VERY_HIGH,
        modifiable: true,
        recommendations: [
          'Smoking cessation program',
          'Lung function monitoring',
          'Respiratory protection measures'
        ]
      });
    }

    return factors;
  }

  private calculateCategoryRisk(riskFactors: RiskFactor[]): RiskLevel {
    const totalScore = riskFactors.reduce((sum, factor) => sum + this.riskScores[factor.impact], 0);
    const averageScore = totalScore / (riskFactors.length || 1);

    if (averageScore >= 4.5) return RiskLevel.VERY_HIGH;
    if (averageScore >= 3.5) return RiskLevel.HIGH;
    if (averageScore >= 2.5) return RiskLevel.MODERATE;
    if (averageScore >= 1.5) return RiskLevel.LOW;
    return RiskLevel.VERY_LOW;
  }

  private generateRiskProjections(
    category: RiskCategory,
    riskFactors: RiskFactor[],
    data: SymptomRiskInput
  ): RiskProjection[] {
    return [
      this.generateTimeframeProjection(TimeFrame.IMMEDIATE, category, riskFactors),
      this.generateTimeframeProjection(TimeFrame.SHORT_TERM, category, riskFactors),
      this.generateTimeframeProjection(TimeFrame.MEDIUM_TERM, category, riskFactors),
      this.generateTimeframeProjection(TimeFrame.LONG_TERM, category, riskFactors)
    ];
  }

  private generateTimeframeProjection(
    timeFrame: TimeFrame,
    category: RiskCategory,
    riskFactors: RiskFactor[]
  ): RiskProjection {
    const modifiableFactors = riskFactors.filter(f => f.modifiable);
    const nonModifiableFactors = riskFactors.filter(f => !f.modifiable);
    const projectedRisk = this.calculateProjectedRisk(timeFrame, riskFactors);

    let influencingFactors: string[] = [];
    let potentialOutcomes: string[] = [];
    let recommendedInterventions: string[] = [];

    switch (timeFrame) {
      case TimeFrame.IMMEDIATE:
        influencingFactors = riskFactors.map(f => f.name);
        potentialOutcomes = this.getImmediateOutcomes(category, riskFactors);
        recommendedInterventions = this.getImmediateInterventions(riskFactors);
        break;
      case TimeFrame.SHORT_TERM:
        influencingFactors = modifiableFactors.map(f => `Modified ${f.name}`);
        potentialOutcomes = this.getShortTermOutcomes(category, riskFactors);
        recommendedInterventions = this.getShortTermInterventions(riskFactors);
        break;
      case TimeFrame.MEDIUM_TERM:
        influencingFactors = modifiableFactors.map(f => `Well-controlled ${f.name}`);
        potentialOutcomes = this.getMediumTermOutcomes(category);
        recommendedInterventions = this.getMediumTermInterventions();
        break;
      case TimeFrame.LONG_TERM:
        influencingFactors = [
          ...modifiableFactors.map(f => `Optimized ${f.name}`),
          ...nonModifiableFactors.map(f => f.name)
        ];
        potentialOutcomes = this.getLongTermOutcomes(category, nonModifiableFactors);
        recommendedInterventions = this.getLongTermInterventions();
        break;
    }

    return {
      timeFrame,
      riskLevel: projectedRisk,
      influencingFactors,
      potentialOutcomes,
      recommendedInterventions
    };
  }

  private calculateProjectedRisk(timeFrame: TimeFrame, riskFactors: RiskFactor[]): RiskLevel {
    const currentRisk = this.calculateCategoryRisk(riskFactors);
    const adjustments: Record<TimeFrame, number> = {
      [TimeFrame.IMMEDIATE]: 0,
      [TimeFrame.SHORT_TERM]: -1,
      [TimeFrame.MEDIUM_TERM]: -2,
      [TimeFrame.LONG_TERM]: -3
    };

    const levels = [
      RiskLevel.VERY_LOW,
      RiskLevel.LOW,
      RiskLevel.MODERATE,
      RiskLevel.HIGH,
      RiskLevel.VERY_HIGH
    ];
    const currentIndex = levels.indexOf(currentRisk);
    const newIndex = Math.max(0, Math.min(levels.length - 1, currentIndex + adjustments[timeFrame]));
    return levels[newIndex];
  }

  private getImmediateOutcomes(category: RiskCategory, riskFactors: RiskFactor[]): string[] {
    const highRiskFactors = riskFactors.filter(f => 
      f.impact === RiskLevel.VERY_HIGH || f.impact === RiskLevel.HIGH
    );
    
    switch (category) {
      case RiskCategory.CARDIOVASCULAR:
        return [
          'Increased risk of acute cardiovascular events',
          'Potential complications from uncontrolled risk factors',
          ...highRiskFactors.map(f => `Immediate impact from ${f.name.toLowerCase()}`)
        ];
      case RiskCategory.RESPIRATORY:
        return [
          'Increased risk of respiratory complications',
          'Potential breathing difficulties',
          ...highRiskFactors.map(f => `Immediate impact from ${f.name.toLowerCase()}`)
        ];
      default:
        return [];
    }
  }

  private getImmediateInterventions(riskFactors: RiskFactor[]): string[] {
    return riskFactors
      .filter(f => f.impact === RiskLevel.VERY_HIGH || f.impact === RiskLevel.HIGH)
      .flatMap(f => f.recommendations);
  }

  private getShortTermOutcomes(category: RiskCategory, riskFactors: RiskFactor[]): string[] {
    const modifiableFactors = riskFactors.filter(f => f.modifiable);
    
    switch (category) {
      case RiskCategory.CARDIOVASCULAR:
        return [
          'Potential stabilization of risk factors with intervention',
          'Improved control of modifiable risks',
          ...modifiableFactors.map(f => `Early benefits from managing ${f.name.toLowerCase()}`)
        ];
      case RiskCategory.RESPIRATORY:
        return [
          'Improved respiratory function with intervention',
          'Better management of symptoms',
          ...modifiableFactors.map(f => `Early benefits from managing ${f.name.toLowerCase()}`)
        ];
      default:
        return [];
    }
  }

  private getShortTermInterventions(riskFactors: RiskFactor[]): string[] {
    return [
      'Regular monitoring of vital signs',
      'Medication adjustment if needed',
      'Lifestyle modification program',
      ...riskFactors
        .filter(f => f.modifiable)
        .flatMap(f => f.recommendations)
    ];
  }

  private getMediumTermOutcomes(category: RiskCategory): string[] {
    switch (category) {
      case RiskCategory.CARDIOVASCULAR:
        return [
          'Sustained improvement in risk profile',
          'Reduced likelihood of complications',
          'Better overall cardiovascular health'
        ];
      case RiskCategory.RESPIRATORY:
        return [
          'Improved respiratory capacity',
          'Better symptom control',
          'Enhanced quality of life'
        ];
      default:
        return [];
    }
  }

  private getMediumTermInterventions(): string[] {
    return [
      'Regular specialist follow-up',
      'Ongoing risk factor management',
      'Preventive health measures',
      'Lifestyle maintenance program'
    ];
  }

  private getLongTermOutcomes(category: RiskCategory, nonModifiableFactors: RiskFactor[]): string[] {
    switch (category) {
      case RiskCategory.CARDIOVASCULAR:
        return [
          'Optimized cardiovascular health',
          'Minimized modifiable risk factors',
          ...nonModifiableFactors.map(f => `Managed impact of ${f.name.toLowerCase()}`)
        ];
      case RiskCategory.RESPIRATORY:
        return [
          'Optimized respiratory function',
          'Well-controlled symptoms',
          ...nonModifiableFactors.map(f => `Managed impact of ${f.name.toLowerCase()}`)
        ];
      default:
        return [];
    }
  }

  private getLongTermInterventions(): string[] {
    return [
      'Regular comprehensive health assessments',
      'Long-term preventive strategy',
      'Ongoing lifestyle optimization',
      'Regular screening for complications'
    ];
  }

  private calculateCategoryConfidence(
    category: RiskCategory,
    data: SymptomRiskInput
  ): ConfidenceLevel {
    // Check data completeness
    const hasCompleteVitals = this.checkVitalsCompleteness(data.vitalSigns);
    const hasCompleteHistory = this.checkHistoryCompleteness(data.medicalContext, data.familyHistory);
    const hasLifestyleData = this.checkLifestyleDataCompleteness(data.lifestyleFactors);

    if (hasCompleteVitals && hasCompleteHistory && hasLifestyleData) {
      return ConfidenceLevel.HIGH;
    }
    if (hasCompleteVitals && (hasCompleteHistory || hasLifestyleData)) {
      return ConfidenceLevel.MEDIUM;
    }
    return ConfidenceLevel.LOW;
  }

  private checkVitalsCompleteness(vitals: any): boolean {
    return !!(
      vitals.bloodPressureSystolic &&
      vitals.bloodPressureDiastolic &&
      vitals.heartRate &&
      vitals.temperature &&
      vitals.oxygenSaturation
    );
  }

  private checkHistoryCompleteness(medical: any, family: any): boolean {
    return !!(
      (medical.chronicConditions && medical.chronicConditions.length > 0) ||
      (medical.currentMedications && medical.currentMedications.length > 0) ||
      (family.familyConditions && family.familyConditions.length > 0)
    );
  }

  private checkLifestyleDataCompleteness(lifestyle: any): boolean {
    return !!(
      typeof lifestyle.smokingPerDay === 'number' &&
      typeof lifestyle.alcoholUnitsPerWeek === 'number' &&
      typeof lifestyle.exerciseHoursPerWeek === 'number'
    );
  }

  private extractRiskFindings(
    category: RiskCategory,
    riskFactors: RiskFactor[],
    data: SymptomRiskInput
  ): string[] {
    const findings = new Set<string>();

    // Add high-risk factors
    riskFactors
      .filter(f => f.impact === RiskLevel.VERY_HIGH || f.impact === RiskLevel.HIGH)
      .forEach(f => findings.add(`High-risk factor: ${f.name}`));

    // Add lifestyle-related findings
    const smokingPerDay = data.lifestyleFactors?.smokingPerDay;
    if (smokingPerDay !== undefined && smokingPerDay > 0) {
      findings.add('Active smoking increases risk');
    }

    const exerciseHoursPerWeek = data.lifestyleFactors?.exerciseHoursPerWeek;
    if (exerciseHoursPerWeek !== undefined && exerciseHoursPerWeek < 2.5) {
      findings.add('Insufficient physical activity');
    }

    // Add family history findings
    const familyConditions = data.familyHistory?.familyConditions;
    if (familyConditions && familyConditions.length > 0) {
      findings.add('Relevant family history present');
    }

    return Array.from(findings);
  }

  private getCategoryWarningSignsToMonitor(category: RiskCategory): string[] {
    switch (category) {
      case RiskCategory.CARDIOVASCULAR:
        return [
          'Chest pain or pressure',
          'Shortness of breath',
          'Irregular heartbeat',
          'Sudden fatigue',
          'Dizziness'
        ];
      case RiskCategory.RESPIRATORY:
        return [
          'Difficulty breathing',
          'Persistent cough',
          'Wheezing',
          'Chest tightness',
          'Decreased exercise tolerance'
        ];
      default:
        return [];
    }
  }

  private determineHighestRisk(assessments: CategoryRiskAssessment[]): RiskLevel {
    const riskLevels = assessments.map(a => a.overallRisk);
    if (riskLevels.includes(RiskLevel.VERY_HIGH)) return RiskLevel.VERY_HIGH;
    if (riskLevels.includes(RiskLevel.HIGH)) return RiskLevel.HIGH;
    if (riskLevels.includes(RiskLevel.MODERATE)) return RiskLevel.MODERATE;
    if (riskLevels.includes(RiskLevel.LOW)) return RiskLevel.LOW;
    return RiskLevel.VERY_LOW;
  }

  private identifyPriorityCategories(assessments: CategoryRiskAssessment[]): RiskCategory[] {
    return assessments
      .filter(a => a.overallRisk === RiskLevel.VERY_HIGH || a.overallRisk === RiskLevel.HIGH)
      .map(a => a.category);
  }

  private generateLifestyleRecommendations(
    data: SymptomRiskInput,
    assessments: CategoryRiskAssessment[]
  ): string[] {
    const recommendations = new Set<string>();

    // Add smoking recommendations
    if (data.lifestyleFactors.smokingPerDay > 0) {
      recommendations.add('Smoking cessation program');
      recommendations.add('Nicotine replacement therapy consideration');
    }

    // Add exercise recommendations
    if (data.lifestyleFactors.exerciseHoursPerWeek < 2.5) {
      recommendations.add('Increase physical activity to at least 150 minutes per week');
      recommendations.add('Consider structured exercise program');
    }

    // Add stress management recommendations
    if (data.lifestyleFactors.stressLevel > 7) {
      recommendations.add('Stress management techniques');
      recommendations.add('Consider counseling or support groups');
    }

    // Add sleep recommendations
    if (data.lifestyleFactors.sleepHoursPerDay < 7) {
      recommendations.add('Improve sleep hygiene');
      recommendations.add('Target 7-9 hours of sleep per night');
    }

    return Array.from(recommendations);
  }

  private determineSpecialistReferrals(assessments: CategoryRiskAssessment[]): string[] {
    const referrals = new Set<string>();

    assessments.forEach(assessment => {
      if (assessment.overallRisk >= RiskLevel.HIGH) {
        switch (assessment.category) {
          case RiskCategory.CARDIOVASCULAR:
            referrals.add('Cardiologist');
            break;
          case RiskCategory.RESPIRATORY:
            referrals.add('Pulmonologist');
            break;
          case RiskCategory.NEUROLOGICAL:
            referrals.add('Neurologist');
            break;
          // Add other categories
        }
      }
    });

    // Add lifestyle specialists
    referrals.add('Nutritionist');
    referrals.add('Exercise Physiologist');

    return Array.from(referrals);
  }

  private determineRiskFollowUp(highestRisk: RiskLevel): string {
    switch (highestRisk) {
      case RiskLevel.VERY_HIGH:
        return 'Immediate medical attention needed';
      case RiskLevel.HIGH:
        return 'Within 1 week';
      case RiskLevel.MODERATE:
        return 'Within 2-4 weeks';
      case RiskLevel.LOW:
        return 'Within 3 months';
      default:
        return 'At next routine visit';
    }
  }

  private checkEmergencyRisk(assessments: CategoryRiskAssessment[]): boolean {
    return assessments.some(assessment => {
      const hasVeryHighRisk = assessment.overallRisk === RiskLevel.VERY_HIGH;
      const hasMultipleHighRisks = assessment.riskFactors.filter(
        f => f.impact === RiskLevel.HIGH
      ).length >= 2;
      return hasVeryHighRisk || hasMultipleHighRisks;
    });
  }

  private calculateRiskConfidence(assessments: CategoryRiskAssessment[]): ConfidenceLevel {
    const confidenceCounts = {
      [ConfidenceLevel.HIGH]: 0,
      [ConfidenceLevel.MEDIUM]: 0,
      [ConfidenceLevel.LOW]: 0
    };

    assessments.forEach(assessment => {
      confidenceCounts[assessment.confidence]++;
    });

    if (confidenceCounts[ConfidenceLevel.HIGH] > assessments.length / 2) {
      return ConfidenceLevel.HIGH;
    }
    if (confidenceCounts[ConfidenceLevel.LOW] > assessments.length / 2) {
      return ConfidenceLevel.LOW;
    }
    return ConfidenceLevel.MEDIUM;
  }

  async generateReport(input: MedicalReportInput): Promise<MedicalReport> {
    try {
      // Encrypt sensitive input data
      const encryptedInput = this.encryptionService.encryptObject(input);

      // Process with encrypted data
      const vitalSignsAssessment = await this.assessVitalSigns(encryptedInput.vitalSigns);
      const symptomAssessments = await Promise.all(
        encryptedInput.symptoms.map(symptom => this.assessSymptom(symptom))
      );

      const diagnosis = await this.generateDiagnosticImpression(
        symptomAssessments,
        vitalSignsAssessment,
        encryptedInput.medicalHistory || []
      );

      const treatmentPlan = await this.generateTreatmentPlan(
        diagnosis,
        symptomAssessments,
        vitalSignsAssessment,
        encryptedInput.medicalHistory || [],
        encryptedInput.allergies || []
      );

      const requiresEmergencyCare = this.evaluateEmergencyStatus(
        diagnosis,
        vitalSignsAssessment,
        symptomAssessments
      );

      const recommendations = await this.generateRecommendations(
        diagnosis,
        treatmentPlan,
        requiresEmergencyCare
      );

      // Encrypt the final report
      const report: MedicalReport = {
        reportId: `REP-${Date.now()}`,
        reportType: input.reportType,
        timestamp: new Date(),
        patientId: input.patientId,
        vitalSigns: vitalSignsAssessment,
        symptoms: symptomAssessments,
        diagnosis,
        treatmentPlan,
        requiresEmergencyCare,
        recommendations,
        notes: input.notes
      };

      return this.encryptionService.encryptObject(report);
    } catch (error) {
      this.metricsService.logError('report_generation', error);
      throw new InternalServerErrorException(
        'Failed to generate medical report',
        error.message
      );
    }
  }

  private async assessVitalSigns(vitalSigns: VitalSigns): Promise<VitalSignsAssessment> {
    const findings: string[] = [];
    let requiresAttention = false;

    // Blood pressure assessment
    if (vitalSigns.bloodPressure) {
      const [systolic, diastolic] = vitalSigns.bloodPressure.split('/').map(Number);
      if (systolic > 140 || diastolic > 90) {
        findings.push(`Blood pressure: Elevated (${vitalSigns.bloodPressure})`);
        requiresAttention = true;
      } else if (systolic < 90 || diastolic < 60) {
        findings.push(`Blood pressure: Low (${vitalSigns.bloodPressure})`);
        requiresAttention = true;
      } else {
        findings.push(`Blood pressure: Normal (${vitalSigns.bloodPressure})`);
      }
    }

    // Heart rate assessment
    if (vitalSigns.heartRate) {
      if (vitalSigns.heartRate > 100) {
        findings.push(`Heart rate: Elevated (${vitalSigns.heartRate} bpm)`);
        requiresAttention = true;
      } else if (vitalSigns.heartRate < 60) {
        findings.push(`Heart rate: Low (${vitalSigns.heartRate} bpm)`);
        requiresAttention = true;
      } else {
        findings.push(`Heart rate: Normal (${vitalSigns.heartRate} bpm)`);
      }
    }

    // Temperature assessment
    if (vitalSigns.temperature) {
      if (vitalSigns.temperature > 38) {
        findings.push(`Temperature: Elevated (${vitalSigns.temperature}°C)`);
        requiresAttention = true;
      } else if (vitalSigns.temperature < 36) {
        findings.push(`Temperature: Low (${vitalSigns.temperature}°C)`);
        requiresAttention = true;
      } else {
        findings.push(`Temperature: Normal (${vitalSigns.temperature}°C)`);
      }
    }

    // Respiratory rate assessment
    if (vitalSigns.respiratoryRate) {
      if (vitalSigns.respiratoryRate > 20) {
        findings.push(`Respiratory rate: Elevated (${vitalSigns.respiratoryRate} breaths/min)`);
        requiresAttention = true;
      } else if (vitalSigns.respiratoryRate < 12) {
        findings.push(`Respiratory rate: Low (${vitalSigns.respiratoryRate} breaths/min)`);
        requiresAttention = true;
      } else {
        findings.push(`Respiratory rate: Normal (${vitalSigns.respiratoryRate} breaths/min)`);
      }
    }

    // Oxygen saturation assessment
    if (vitalSigns.oxygenSaturation) {
      if (vitalSigns.oxygenSaturation < 95) {
        findings.push(`Oxygen saturation: Low (${vitalSigns.oxygenSaturation}%)`);
        requiresAttention = true;
      } else {
        findings.push(`Oxygen saturation: Normal (${vitalSigns.oxygenSaturation}%)`);
      }
    }

    const summary = requiresAttention
      ? 'Abnormal vital signs requiring attention'
      : 'Vital signs within normal limits';

    return {
      summary,
      findings,
      requiresAttention
    };
  }

  private async assessSymptom(symptom: SymptomDetail): Promise<SymptomAssessment> {
    // Encrypt symptom details before processing
    const encryptedSymptom = this.encryptionService.encryptObject(symptom);
    
    const validatedTerm = await this.medicalTerminology.validateTerm(encryptedSymptom.name);
    const riskFactors = await this.identifyRiskFactors(
      encryptedSymptom.name,
      encryptedSymptom.severity,
      encryptedSymptom.details || ''
    );

    const interpretation = await this.llmOrchestrationService.analyzeText({
      text: `${encryptedSymptom.name} - ${encryptedSymptom.details || ''} (${encryptedSymptom.duration})`,
      context: 'symptom_interpretation'
    });

    // Encrypt the assessment before returning
    return this.encryptionService.encryptObject({
      name: validatedTerm,
      severity: symptom.severity,
      duration: symptom.duration,
      interpretation: interpretation.summary,
      riskFactors
    });
  }

  private async generateDiagnosticImpression(
    symptoms: SymptomAssessment[],
    vitalSigns: VitalSignsAssessment,
    medicalHistory: string[]
  ): Promise<DiagnosticImpression> {
    // Prepare context for LLM analysis
    const context = {
      symptoms: symptoms.map(s => ({
        name: s.name,
        severity: s.severity,
        duration: s.duration,
        interpretation: s.interpretation
      })),
      vitalSigns,
      medicalHistory
    };

    // Get diagnostic analysis from LLM
    const analysis = await this.llmOrchestrationService.analyzeText({
      text: JSON.stringify(context),
      context: 'diagnostic_impression'
    });

    return {
      primaryImpression: analysis.primaryDiagnosis || 'Unknown',
      confidence: analysis.confidence,
      supportingEvidence: analysis.evidence || [],
      differentialDiagnoses: analysis.differentials || []
    };
  }

  private async generateTreatmentPlan(
    diagnosis: DiagnosticImpression,
    symptoms: SymptomAssessment[],
    vitalSigns: VitalSignsAssessment,
    medicalHistory: string[],
    allergies: string[]
  ): Promise<TreatmentPlan> {
    // Prepare context for LLM analysis
    const context = {
      diagnosis,
      symptoms,
      vitalSigns,
      medicalHistory,
      allergies
    };

    // Get treatment recommendations from LLM
    const analysis = await this.llmOrchestrationService.analyzeText({
      text: JSON.stringify(context),
      context: 'treatment_plan'
    });

    return {
      immediateActions: analysis.immediateActions || [],
      medications: analysis.medications || [],
      investigations: analysis.investigations || [],
      referrals: analysis.referrals || [],
      followUp: analysis.followUp || []
    };
  }

  private evaluateEmergencyStatus(
    diagnosis: DiagnosticImpression,
    vitalSigns: VitalSignsAssessment,
    symptoms: SymptomAssessment[]
  ): boolean {
    // Check vital signs
    if (vitalSigns.requiresAttention) {
      return true;
    }

    // Check for severe symptoms
    const hasSevereSymptoms = symptoms.some(
      s => s.severity === SymptomSeverity.SEVERE
    );
    if (hasSevereSymptoms) {
      return true;
    }

    // Check diagnosis confidence and severity
    const isHighRiskDiagnosis = this.isHighRiskCondition(diagnosis.primaryImpression);
    if (isHighRiskDiagnosis && diagnosis.confidence > 0.7) {
      return true;
    }

    return false;
  }

  private async generateRecommendations(
    diagnosis: DiagnosticImpression,
    treatmentPlan: TreatmentPlan,
    requiresEmergencyCare: boolean
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (requiresEmergencyCare) {
      recommendations.push('Seek immediate emergency medical attention');
    }

    // Add treatment-based recommendations
    if (treatmentPlan.immediateActions.length > 0) {
      recommendations.push(...treatmentPlan.immediateActions);
    }

    // Add follow-up recommendations
    if (treatmentPlan.followUp.length > 0) {
      recommendations.push(...treatmentPlan.followUp);
    }

    // Add diagnostic-based recommendations
    if (diagnosis.confidence < 0.7) {
      recommendations.push('Further evaluation may be needed to confirm diagnosis');
    }

    return recommendations;
  }

  private async identifyRiskFactors(
    symptom: string,
    severity: SymptomSeverity,
    details: string
  ): Promise<string[]> {
    const analysis = await this.llmOrchestrationService.analyzeText({
      text: `Symptom: ${symptom}\nSeverity: ${severity}\nDetails: ${details}`,
      context: 'risk_factors'
    });

    return analysis.riskFactors || [];
  }

  private isHighRiskCondition(condition: string): boolean {
    const highRiskConditions = [
      'myocardial infarction',
      'stroke',
      'pulmonary embolism',
      'sepsis',
      'anaphylaxis',
      'meningitis',
      'acute respiratory failure',
      'diabetic ketoacidosis',
      'status epilepticus',
      'acute abdomen'
    ];

    return highRiskConditions.some(c =>
      condition.toLowerCase().includes(c.toLowerCase())
    );
  }

  async exportToEHR(
    riskAssessment: RiskAssessmentResponse,
    options: EHRExportOptions
  ): Promise<FHIRBundle> {
    try {
      const bundle: FHIRBundle = {
        resourceType: 'Bundle',
        type: options.bundleType || 'collection',
        entry: []
      };

      // Add observations if requested
      if (options.includeObservations) {
        const observations = this.createFHIRObservations(riskAssessment, options.patientReference);
        bundle.entry.push(...observations.map(obs => ({ resource: obs })));
      }

      // Add risk assessments if requested
      if (options.includeRiskAssessments) {
        const riskAssessments = this.createFHIRRiskAssessments(
          riskAssessment,
          options.patientReference
        );
        bundle.entry.push(...riskAssessments.map(risk => ({ resource: risk })));
      }

      return bundle;
    } catch (error) {
      this.logger.error(`Error exporting to EHR: ${error.message}`);
      throw new InternalServerErrorException('Failed to export data to EHR', error.message);
    }
  }

  private createFHIRObservations(
    assessment: RiskAssessmentResponse,
    patientReference: string
  ): FHIRObservation[] {
    const observations: FHIRObservation[] = [];

    // Create risk level observation
    observations.push({
      resourceType: 'Observation',
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'survey',
          display: 'Survey'
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '72136-5',
          display: 'Risk level'
        }]
      },
      subject: {
        reference: patientReference
      },
      effectiveDateTime: assessment.timestamp.toISOString(),
      valueCodeableConcept: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/risk-level',
          code: assessment.highestRiskLevel,
          display: assessment.highestRiskLevel
        }]
      }
    });

    // Add confidence level observation
    observations.push({
      resourceType: 'Observation',
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'survey',
          display: 'Survey'
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '81339-3',
          display: 'Assessment confidence'
        }]
      },
      subject: {
        reference: patientReference
      },
      effectiveDateTime: assessment.timestamp.toISOString(),
      valueCodeableConcept: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/confidence-level',
          code: assessment.overallConfidence,
          display: assessment.overallConfidence
        }]
      }
    });

    return observations;
  }

  private createFHIRRiskAssessments(
    assessment: RiskAssessmentResponse,
    patientReference: string
  ): FHIRRiskAssessment[] {
    const riskAssessments: FHIRRiskAssessment[] = [];

    // Create main risk assessment
    const mainAssessment: FHIRRiskAssessment = {
      resourceType: 'RiskAssessment',
      status: 'final',
      subject: {
        reference: patientReference
      },
      occurrenceDateTime: assessment.timestamp.toISOString(),
      prediction: assessment.categoryAssessments.map(category => ({
        outcome: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/risk-category',
            code: category.category,
            display: category.category
          }]
        },
        qualitativeRisk: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/risk-level',
            code: category.overallRisk,
            display: category.overallRisk
          }]
        }
      })),
      note: [
        {
          text: assessment.requiresEmergencyCare
            ? 'Requires immediate emergency care'
            : `Follow-up recommended: ${assessment.followUpTimeframe}`
        }
      ]
    };

    riskAssessments.push(mainAssessment);

    // Add individual category assessments
    assessment.categoryAssessments.forEach(category => {
      const categoryAssessment: FHIRRiskAssessment = {
        resourceType: 'RiskAssessment',
        status: 'final',
        subject: {
          reference: patientReference
        },
        occurrenceDateTime: assessment.timestamp.toISOString(),
        prediction: [{
          outcome: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/risk-category',
              code: category.category,
              display: category.category
            }]
          },
          qualitativeRisk: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/risk-level',
              code: category.overallRisk,
              display: category.overallRisk
            }]
          }
        }],
        note: [
          {
            text: category.keyFindings.join('; ')
          }
        ]
      };

      riskAssessments.push(categoryAssessment);
    });

    return riskAssessments;
  }
} 