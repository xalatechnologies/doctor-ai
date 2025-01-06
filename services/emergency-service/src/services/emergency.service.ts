import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EmergencyCategory, EmergencyAssessment, EmergencySeverity } from '@interfaces/emergency.interface';
import { AssessEmergencyDto } from '@dto/assess-emergency.dto';
import { EmergencyAssessmentException, InvalidEmergencyDataException } from '@exceptions/emergency.exception';
import { RabbitMQService } from '@rabbitmq/rabbitmq.service';

@Injectable()
export class EmergencyService {
  private readonly logger = new Logger(EmergencyService.name);

  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async assessEmergency(data: AssessEmergencyDto): Promise<EmergencyAssessment> {
    try {
      this.validateEmergencyData(data);
      const assessment = await this.performEmergencyAssessment(data);

      try {
        await this.rabbitMQService.publishEmergencyAssessment('emergency.assessed', {
          assessment,
          originalData: data,
        });
      } catch (error) {
        this.logger.warn('Failed to publish emergency assessment, but continuing execution', error);
      }

      return assessment;
    } catch (error) {
      this.logger.error('Failed to assess emergency', error);
      if (error instanceof InvalidEmergencyDataException) {
        throw error;
      }
      throw new EmergencyAssessmentException('Failed to assess emergency');
    }
  }

  private validateEmergencyData(data: AssessEmergencyDto): void {
    if (!data.description || !data.primarySymptom) {
      throw new InvalidEmergencyDataException('Missing required emergency data');
    }
  }

  private async performEmergencyAssessment(data: AssessEmergencyDto): Promise<EmergencyAssessment> {
    const severity = this.determineEmergencySeverity(data);
    const triageScore = this.calculateTriageScore(data);
    const requiresAmbulance = this.determineAmbulanceRequirement(severity, triageScore);
    const specialists = this.determineRequiredSpecialists(data);
    const actions = this.determineImmediateActions(data, severity);
    const recommendations = this.generateRecommendations(data, severity, requiresAmbulance);

    return {
      emergencyId: uuidv4(),
      category: data.category,
      primarySymptom: data.primarySymptom,
      secondarySymptoms: data.secondarySymptoms,
      severity,
      triageScore,
      requiresAmbulance,
      immediateActions: actions,
      recommendations,
      requiredSpecialists: specialists,
      timestamp: new Date().toISOString(),
    };
  }

  private determineEmergencySeverity(data: AssessEmergencyDto): EmergencySeverity {
    if (data.severityLevel >= 8 || data.distressLevel >= 8) {
      return EmergencySeverity.HIGH;
    }
    if (data.severityLevel >= 5 || data.distressLevel >= 5) {
      return EmergencySeverity.MEDIUM;
    }
    return EmergencySeverity.LOW;
  }

  private calculateTriageScore(data: AssessEmergencyDto): number {
    let score = data.severityLevel;

    if (data.onset === 'sudden') {
      score += 2;
    }

    if (data.currentMedications?.includes('warfarin') || data.currentMedications?.includes('aspirin')) {
      score += 1;
    }

    if (data.category === EmergencyCategory.CARDIAC || data.category === EmergencyCategory.RESPIRATORY) {
      score += 1;
    }

    return Math.min(Math.max(score, 1), 10);
  }

  private determineAmbulanceRequirement(severity: EmergencySeverity, triageScore: number): boolean {
    return severity === EmergencySeverity.HIGH || triageScore >= 8;
  }

  private determineRequiredSpecialists(data: AssessEmergencyDto): string[] {
    const specialists = new Set<string>();

    switch (data.category) {
      case EmergencyCategory.CARDIAC:
        specialists.add('Cardiologist');
        break;
      case EmergencyCategory.RESPIRATORY:
        specialists.add('Pulmonologist');
        break;
      case EmergencyCategory.NEUROLOGICAL:
        specialists.add('Neurologist');
        break;
      case EmergencyCategory.TRAUMA:
        specialists.add('Trauma Surgeon');
        break;
      case EmergencyCategory.TOXICOLOGY:
        specialists.add('Toxicologist');
        break;
    }

    specialists.add('Emergency Medicine Physician');
    return Array.from(specialists);
  }

  private determineImmediateActions(data: AssessEmergencyDto, severity: EmergencySeverity): string[] {
    const actions = ['Monitor vital signs'];

    if (severity === EmergencySeverity.HIGH) {
      actions.push('Prepare emergency response team');
      actions.push('Clear emergency bay');
    }

    if (data.currentMedications?.length > 0) {
      actions.push('Review current medications');
    }

    switch (data.category) {
      case EmergencyCategory.CARDIAC:
        actions.push('Prepare ECG equipment');
        actions.push('Have defibrillator on standby');
        break;
      case EmergencyCategory.RESPIRATORY:
        actions.push('Prepare oxygen therapy');
        actions.push('Have intubation equipment ready');
        break;
      case EmergencyCategory.TRAUMA:
        actions.push('Prepare trauma bay');
        actions.push('Alert blood bank');
        break;
    }

    return actions;
  }

  private generateRecommendations(
    data: AssessEmergencyDto,
    severity: EmergencySeverity,
    requiresAmbulance: boolean,
  ): string[] {
    const recommendations: string[] = [];

    if (requiresAmbulance) {
      recommendations.push('Call emergency services (911) immediately');
    }

    if (data.currentMedications?.some(med => ['warfarin', 'aspirin', 'clopidogrel'].includes(med))) {
      recommendations.push('Alert medical staff about blood thinners');
    }

    switch (severity) {
      case EmergencySeverity.HIGH:
        recommendations.push('Do not move the patient unless in immediate danger');
        recommendations.push('Keep patient calm and reassured');
        break;
      case EmergencySeverity.MEDIUM:
        recommendations.push('Monitor patient closely');
        recommendations.push('Document any changes in symptoms');
        break;
      case EmergencySeverity.LOW:
        recommendations.push('Keep patient comfortable');
        recommendations.push('Monitor for worsening symptoms');
        break;
    }

    return recommendations;
  }

  async handleTreatmentPlan(data: { treatmentPlan: any; patientData: any }): Promise<void> {
    this.logger.log('Processing treatment plan for emergency case');
    // Add implementation based on your requirements
  }
} 