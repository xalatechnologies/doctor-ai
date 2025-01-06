import { Injectable, Logger } from '@nestjs/common';
import { AnalyzeSymptomDto } from '@dto/analyze-symptom.dto';
import { RabbitMQService } from '@rabbitmq/rabbitmq.service';
import { SymptomAnalysis, EmergencyAnalysis } from '@interfaces/symptom.interface';

@Injectable()
export class SymptomAnalysisService {
  private readonly logger = new Logger(SymptomAnalysisService.name);

  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async analyzeSymptom(data: AnalyzeSymptomDto): Promise<SymptomAnalysis> {
    try {
      this.logger.log(`Analyzing symptoms for: ${data.description}`);

      const analysis = await this.performSymptomAnalysis(data);

      // Publish the analysis result
      await this.rabbitMQService.publishEmergencyAssessment('symptom.analyzed', {
        analysis,
        originalData: data,
      });

      return analysis;
    } catch (error) {
      this.logger.error(`Error in symptom analysis: ${error.message}`);
      throw error;
    }
  }

  async handleEmergencyAssessment(data: any): Promise<void> {
    try {
      this.logger.log('Received emergency assessment for further analysis');

      const detailedAnalysis = await this.analyzeEmergencyCase(data);

      // Publish detailed analysis
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
    const requiredSpecialties = this.determineRequiredSpecialties(possibleConditions);

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
    return `SYM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateSeverity(data: AnalyzeSymptomDto): { level: number; description: string } {
    let severityScore = data.severityLevel;

    // Adjust severity based on pain level
    severityScore = Math.max(severityScore, data.painLevel);

    // Adjust severity based on duration
    if (data.duration.toLowerCase().includes('chronic') || 
        data.duration.toLowerCase().includes('weeks') || 
        data.duration.toLowerCase().includes('months')) {
      severityScore = Math.min(severityScore + 2, 10);
    }

    // Adjust severity based on aggravating factors
    if (data.aggravatingFactors && data.aggravatingFactors.length > 0) {
      severityScore = Math.min(severityScore + 1, 10);
    }

    return {
      level: severityScore,
      description: this.getSeverityDescription(severityScore),
    };
  }

  private getSeverityDescription(level: number): string {
    if (level >= 8) return 'Severe';
    if (level >= 5) return 'Moderate';
    return 'Mild';
  }

  private analyzePossibleConditions(data: AnalyzeSymptomDto): string[] {
    const conditions: string[] = [];

    // Add basic condition based on primary symptom
    conditions.push(`Possible ${data.primarySymptom} related condition`);

    // Add conditions based on secondary symptoms
    if (data.secondarySymptoms) {
      data.secondarySymptoms.forEach(symptom => {
        conditions.push(`Condition related to ${symptom}`);
      });
    }

    // Consider patient history
    if (data.patientHistory) {
      conditions.push('Condition influenced by patient history');
    }

    return conditions;
  }

  private generateRecommendations(
    data: AnalyzeSymptomDto,
    severity: { level: number; description: string },
    conditions: string[],
  ): string[] {
    const recommendations: string[] = [];

    // Basic recommendations based on severity
    if (severity.level >= 8) {
      recommendations.push('Seek immediate medical attention');
    } else if (severity.level >= 5) {
      recommendations.push('Schedule an appointment with a healthcare provider');
    } else {
      recommendations.push('Monitor symptoms and maintain a symptom diary');
    }

    // Recommendations based on alleviating factors
    if (data.alleviatingFactors) {
      data.alleviatingFactors.forEach(factor => {
        recommendations.push(`Continue with ${factor} as it helps alleviate symptoms`);
      });
    }

    // Medication-related recommendations
    if (data.currentMedications) {
      recommendations.push('Continue prescribed medications as directed');
      recommendations.push('Keep a record of medication effectiveness');
    }

    return recommendations;
  }

  private determineUrgencyLevel(severityLevel: number, data: AnalyzeSymptomDto): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (severityLevel >= 8) return 'HIGH';
    if (severityLevel >= 5) return 'MEDIUM';
    if (data.painLevel >= 7) return 'MEDIUM';
    return 'LOW';
  }

  private determineRequiredSpecialties(conditions: string[]): string[] {
    // This would typically involve a more sophisticated mapping of conditions to specialties
    return ['General Practice', 'Specialist Consultation if needed'];
  }

  private determineFollowUpActions(
    urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH',
    specialties: string[],
  ): string[] {
    const actions: string[] = [];

    switch (urgencyLevel) {
      case 'HIGH':
        actions.push('Immediate medical evaluation required');
        actions.push('Consider emergency services if symptoms worsen');
        break;
      case 'MEDIUM':
        actions.push('Schedule medical appointment within 48 hours');
        actions.push('Monitor symptoms closely');
        break;
      case 'LOW':
        actions.push('Schedule routine follow-up if symptoms persist');
        actions.push('Implement recommended lifestyle changes');
        break;
    }

    specialties.forEach(specialty => {
      actions.push(`Consult with ${specialty}`);
    });

    return actions;
  }

  private async analyzeEmergencyCase(data: any): Promise<EmergencyAnalysis> {
    // Perform detailed analysis of emergency cases
    // This would typically involve more sophisticated medical analysis
    return {
      timestamp: new Date().toISOString(),
      emergencyCategory: data.assessment.category,
      detailedRecommendations: this.generateDetailedRecommendations(data),
      specialistReferrals: this.determineSpecialistReferrals(data),
      followUpPlan: this.createFollowUpPlan(data),
    };
  }

  private generateDetailedRecommendations(data: any): string[] {
    const recommendations: string[] = [];

    // Add emergency-specific recommendations
    if (data.assessment.severity === 'HIGH') {
      recommendations.push('Continue monitoring vital signs');
      recommendations.push('Prepare detailed medical history for emergency team');
    }

    // Add medication-specific recommendations
    if (data.patientData.medications) {
      recommendations.push('Provide complete medication list to healthcare providers');
    }

    return recommendations;
  }

  private determineSpecialistReferrals(data: any): string[] {
    const referrals: string[] = [];

    // Determine specialists based on emergency category
    switch (data.assessment.category) {
      case 'CARDIAC':
        referrals.push('Cardiologist');
        break;
      case 'RESPIRATORY':
        referrals.push('Pulmonologist');
        break;
      case 'NEUROLOGICAL':
        referrals.push('Neurologist');
        break;
      default:
        referrals.push('General Practitioner');
    }

    return referrals;
  }

  private createFollowUpPlan(data: any): { immediateActions: string[]; shortTermFollowUp: string; longTermMonitoring: string } {
    return {
      immediateActions: data.assessment.immediateActions,
      shortTermFollowUp: 'Schedule follow-up within 48 hours of emergency',
      longTermMonitoring: 'Regular check-ups based on specialist recommendations',
    };
  }
} 