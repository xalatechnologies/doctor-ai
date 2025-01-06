import { Injectable, Logger } from '@nestjs/common';
import { AnalyzeSymptomDto } from '@dto/analyze-symptom.dto';
import { RabbitMQService } from '@rabbitmq/rabbitmq.service';
import { SymptomAnalysis, EmergencyAnalysis } from '@interfaces/symptom.interface';

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

  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async analyzeSymptom(data: AnalyzeSymptomDto): Promise<SymptomAnalysis> {
    try {
      this.logger.log(`Analyzing symptoms for: ${data.description}`);

      const analysis = await this.performSymptomAnalysis(data);

      try {
        await this.rabbitMQService.publishEmergencyAssessment('symptom.analyzed', {
          analysis,
          originalData: data,
        });
      } catch (error) {
        this.logger.error(`Failed to publish analysis result: ${error.message}`);
        // Continue execution as the analysis is still valid
      }

      return analysis;
    } catch (error) {
      this.logger.error(`Error in symptom analysis: ${error.message}`);
      throw error;
    }
  }

  async handleEmergencyAssessment(data: EmergencyAssessmentData): Promise<void> {
    try {
      this.logger.log('Received emergency assessment for further analysis');

      const detailedAnalysis = await this.analyzeEmergencyCase(data);

      await this.rabbitMQService.publishEmergencyAssessment('symptom.emergency.analyzed', {
        emergencyData: data,
        detailedAnalysis,
      });
    } catch (error) {
      this.logger.error(`Error handling emergency assessment: ${error.message}`);
      throw error;
    }
  }

  private async performSymptomAnalysis(data: AnalyzeSymptomDto): Promise<SymptomAnalysis> {
    const symptomId = this.generateSymptomId();
    const severity = this.calculateSeverity(data);
    const possibleConditions = this.analyzePossibleConditions(data);
    const recommendations = this.generateRecommendations(data, severity, possibleConditions);
    const urgencyLevel = this.determineUrgencyLevel(severity.level, data);
    const requiredSpecialties = this.determineRequiredSpecialties(data, possibleConditions);

    return {
      symptomId,
      primarySymptom: data.primarySymptom,
      secondarySymptoms: data.secondarySymptoms || [],
      severity,
      possibleConditions,
      recommendations,
      urgencyLevel,
      requiredSpecialties,
      followUpActions: this.determineFollowUpActions(urgencyLevel, requiredSpecialties),
      timestamp: new Date().toISOString(),
    };
  }

  private generateSymptomId(): string {
    return `SYM-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private calculateSeverity(data: AnalyzeSymptomDto): { level: number; description: string } {
    let severityScore = Math.max(data.severityLevel, data.painLevel);

    // Adjust severity based on duration
    if (this.isChronicDuration(data.duration)) {
      severityScore = Math.min(severityScore + 2, 10);
    }

    // Adjust severity based on aggravating factors
    if (data.aggravatingFactors && data.aggravatingFactors.length > 0) {
      severityScore = Math.min(severityScore + 1, 10);
    }

    // Adjust severity based on secondary symptoms
    if (data.secondarySymptoms && data.secondarySymptoms.length > 0) {
      severityScore = Math.min(severityScore + 1, 10);
    }

    return {
      level: severityScore,
      description: this.getSeverityDescription(severityScore),
    };
  }

  private isChronicDuration(duration: string): boolean {
    const chronicKeywords = ['chronic', 'weeks', 'months', 'years', 'persistent'];
    return chronicKeywords.some(keyword => duration.toLowerCase().includes(keyword));
  }

  private getSeverityDescription(level: number): string {
    if (level >= 8) return 'Severe';
    if (level >= 5) return 'Moderate';
    return 'Mild';
  }

  private analyzePossibleConditions(data: AnalyzeSymptomDto): string[] {
    const conditions: string[] = [];

    // Add primary condition
    conditions.push(`Possible ${data.primarySymptom} related condition`);

    // Add conditions based on secondary symptoms
    if (data.secondarySymptoms && data.secondarySymptoms.length > 0) {
      conditions.push(...data.secondarySymptoms.map(symptom => `Condition related to ${symptom}`));
    }

    // Consider patient history
    if (data.patientHistory) {
      conditions.push(`Condition influenced by ${data.patientHistory}`);
    }

    return conditions;
  }

  private generateRecommendations(
    data: AnalyzeSymptomDto,
    severity: { level: number; description: string },
    conditions: string[],
  ): string[] {
    const recommendations: string[] = [];

    // Add severity-based recommendations
    recommendations.push(this.getSeverityBasedRecommendation(severity.level));

    // Add alleviating factors recommendations
    if (data.alleviatingFactors && data.alleviatingFactors.length > 0) {
      recommendations.push(
        ...data.alleviatingFactors.map(
          factor => `Continue with ${factor} as it helps alleviate symptoms`,
        ),
      );
    }

    // Add medication recommendations
    if (data.currentMedications && data.currentMedications.length > 0) {
      recommendations.push(
        'Continue prescribed medications as directed',
        'Keep a record of medication effectiveness',
      );
    }

    return recommendations;
  }

  private getSeverityBasedRecommendation(severityLevel: number): string {
    if (severityLevel >= 8) return 'Seek immediate medical attention';
    if (severityLevel >= 5) return 'Schedule an appointment with a healthcare provider';
    return 'Monitor symptoms and maintain a symptom diary';
  }

  private determineUrgencyLevel(severityLevel: number, data: AnalyzeSymptomDto): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (severityLevel >= 8 || data.painLevel >= 8) return 'HIGH';
    if (severityLevel >= 5 || data.painLevel >= 6) return 'MEDIUM';
    return 'LOW';
  }

  private determineRequiredSpecialties(data: AnalyzeSymptomDto, conditions: string[]): string[] {
    const specialties = new Set<string>(['General Practice']);

    // Add specialties based on symptoms
    const specialtyMap: Record<string, string[]> = {
      'chest pain': ['Cardiology'],
      'shortness of breath': ['Pulmonology'],
      'headache': ['Neurology'],
      'joint pain': ['Rheumatology'],
      'skin': ['Dermatology'],
    };

    // Check primary symptom
    Object.entries(specialtyMap).forEach(([symptom, relatedSpecialties]) => {
      if (data.primarySymptom.toLowerCase().includes(symptom)) {
        relatedSpecialties.forEach(specialty => specialties.add(specialty));
      }
    });

    // Check secondary symptoms
    data.secondarySymptoms?.forEach(symptom => {
      Object.entries(specialtyMap).forEach(([key, relatedSpecialties]) => {
        if (symptom.toLowerCase().includes(key)) {
          relatedSpecialties.forEach(specialty => specialties.add(specialty));
        }
      });
    });

    return Array.from(specialties);
  }

  private determineFollowUpActions(
    urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH',
    specialties: string[],
  ): string[] {
    const actions: string[] = [];

    switch (urgencyLevel) {
      case 'HIGH':
        actions.push(
          'Immediate medical evaluation required',
          'Consider emergency services if symptoms worsen',
        );
        break;
      case 'MEDIUM':
        actions.push(
          'Schedule medical appointment within 48 hours',
          'Monitor symptoms closely',
        );
        break;
      case 'LOW':
        actions.push(
          'Schedule routine follow-up if symptoms persist',
          'Implement recommended lifestyle changes',
        );
        break;
    }

    // Add specialty-specific actions
    specialties.forEach(specialty => {
      if (specialty !== 'General Practice') {
        actions.push(`Schedule consultation with ${specialty}`);
      }
    });

    return actions;
  }

  private async analyzeEmergencyCase(data: EmergencyAssessmentData): Promise<EmergencyAnalysis> {
    return {
      timestamp: new Date().toISOString(),
      emergencyCategory: data.assessment.category,
      detailedRecommendations: this.generateDetailedRecommendations(data),
      specialistReferrals: this.determineSpecialistReferrals(data),
      followUpPlan: this.createFollowUpPlan(data),
    };
  }

  private generateDetailedRecommendations(data: EmergencyAssessmentData): string[] {
    const recommendations: string[] = [];

    // Add severity-based recommendations
    if (data.assessment.severity === 'HIGH') {
      recommendations.push(
        'Continue monitoring vital signs',
        'Prepare detailed medical history for emergency team',
      );
    }

    // Add medication-specific recommendations
    if (data.patientData.medications && data.patientData.medications.length > 0) {
      recommendations.push(
        'Provide complete medication list to healthcare providers',
        'Note any recent changes in medication',
      );
    }

    return recommendations;
  }

  private determineSpecialistReferrals(data: EmergencyAssessmentData): string[] {
    const specialistMap: Record<string, string> = {
      CARDIAC: 'Cardiologist',
      RESPIRATORY: 'Pulmonologist',
      NEUROLOGICAL: 'Neurologist',
    };

    return [specialistMap[data.assessment.category] || 'General Practitioner'];
  }

  private createFollowUpPlan(data: EmergencyAssessmentData): {
    immediateActions: string[];
    shortTermFollowUp: string;
    longTermMonitoring: string;
  } {
    return {
      immediateActions: data.assessment.immediateActions,
      shortTermFollowUp: 'Schedule follow-up within 48 hours of emergency',
      longTermMonitoring: 'Regular check-ups based on specialist recommendations',
    };
  }
} 