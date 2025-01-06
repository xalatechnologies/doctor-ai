import { Injectable, Logger } from '@nestjs/common';
import { AssessEmergencyDto } from '@dto/assess-emergency.dto';
import { EmergencyAssessment, EmergencyCategory, EmergencySeverity } from '@interfaces/emergency.interface';
import { EmergencyAssessmentException, InvalidEmergencyDataException } from '@exceptions/emergency.exception';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class EmergencyService {
  private readonly logger = new Logger(EmergencyService.name);

  constructor(private readonly rabbitMQService: RabbitMQService) {}

  private readonly EMERGENCY_KEYWORDS = {
    [EmergencyCategory.CARDIAC]: [
      'chest pain', 'heart attack', 'palpitations', 'shortness of breath', 
      'hart', 'pecho', 'heart feels funny', 'chest pane'
    ],
    [EmergencyCategory.RESPIRATORY]: [
      'breathing', 'asthma', 'choking', 'suffocation', 
      'cant catch breath', 'breathe', 'cant breathe'
    ],
    [EmergencyCategory.TRAUMA]: ['bleeding', 'injury', 'accident', 'fall', 'wound'],
    [EmergencyCategory.NEUROLOGICAL]: ['unconscious', 'seizure', 'stroke', 'paralysis'],
  };

  private readonly HIGH_RISK_MEDICATIONS = ['warfarin', 'aspirin', 'clopidogrel', 'blood thinner'];
  private readonly PEDIATRIC_AGE_THRESHOLD = 12;
  private readonly ELDERLY_AGE_THRESHOLD = 65;

  async assessEmergency(data: AssessEmergencyDto): Promise<EmergencyAssessment> {
    try {
      this.logger.log(`Processing emergency assessment for situation: ${data.description}`);
      
      if (!data.description || data.description.trim() === '') {
        throw new InvalidEmergencyDataException('Missing required emergency data');
      }

      const age = parseInt(data.age);
      if (isNaN(age) || age < 0 || age > 120) {
        throw new InvalidEmergencyDataException('Invalid age format or value');
      }

      const category = this.determineCategory(data);
      const severity = this.analyzeSeverity(data, category, age);
      const triageScore = this.calculateTriageScore(severity, data, age);

      const assessment: EmergencyAssessment = {
        severity,
        category,
        recommendations: this.generateRecommendations(data, severity, category, age),
        immediateActions: this.determineImmediateActions(severity, category, data),
        requiresAmbulance: severity === EmergencySeverity.HIGH,
        timestamp: new Date().toISOString(),
        triageScore,
      };

      // Publish the assessment to RabbitMQ
      await this.rabbitMQService.publishEmergencyAssessment('emergency.assessed', {
        assessment,
        patientData: {
          age: data.age,
          existingConditions: data.existingConditions,
          medications: data.medications,
        },
      });

      this.logger.log(`Emergency assessment completed: ${JSON.stringify(assessment)}`);
      return assessment;
    } catch (error) {
      this.logger.error(`Error in emergency assessment: ${error.message}`);
      if (error instanceof InvalidEmergencyDataException) {
        throw error;
      }
      throw new EmergencyAssessmentException('Failed to assess emergency situation');
    }
  }

  private determineCategory(data: AssessEmergencyDto): EmergencyCategory {
    const description = data.description.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.EMERGENCY_KEYWORDS)) {
      if (keywords.some(keyword => description.includes(keyword))) {
        return category as EmergencyCategory;
      }
    }
    
    return EmergencyCategory.GENERAL;
  }

  private analyzeSeverity(data: AssessEmergencyDto, category: EmergencyCategory, age: number): EmergencySeverity {
    const description = data.description.toLowerCase();
    
    // Life-threatening conditions
    if (description.includes('not breathing') || description.includes('unconscious')) {
      return EmergencySeverity.HIGH;
    }

    // High severity indicators
    if (category === EmergencyCategory.CARDIAC || 
        category === EmergencyCategory.RESPIRATORY ||
        description.includes('severe') ||
        description.includes('extreme') ||
        this.isRecentSurgeryCase(data.existingConditions) ||
        this.isAllergicReaction(data)) {
      return EmergencySeverity.HIGH;
    }

    // Medium severity cases
    if (age <= this.PEDIATRIC_AGE_THRESHOLD || 
        age >= this.ELDERLY_AGE_THRESHOLD ||
        this.hasHighRiskMedications(data.medications)) {
      return EmergencySeverity.MEDIUM;
    }

    // Medium severity for cases with existing conditions
    if (data.existingConditions && data.existingConditions.length > 0) {
      return EmergencySeverity.MEDIUM;
    }

    return EmergencySeverity.LOW;
  }

  private hasHighRiskMedications(medications?: string[]): boolean {
    if (!medications) return false;
    return medications.some(med => 
      this.HIGH_RISK_MEDICATIONS.some(risk => med.toLowerCase().includes(risk))
    );
  }

  private isRecentSurgeryCase(conditions?: string[]): boolean {
    if (!conditions) return false;
    return conditions.some(condition => 
      condition.toLowerCase().includes('surgery') || 
      condition.toLowerCase().includes('post-op')
    );
  }

  private isAllergicReaction(data: AssessEmergencyDto): boolean {
    const hasAllergy = data.existingConditions?.some(condition => 
      condition.toLowerCase().includes('allergy')
    ) ?? false;
    const mentionsAllergicSymptoms = data.description.toLowerCase().includes('allergic') ||
      data.description.toLowerCase().includes('after eating');
    return hasAllergy && mentionsAllergicSymptoms;
  }

  private calculateTriageScore(severity: EmergencySeverity, data: AssessEmergencyDto, age: number): number {
    let score = 0;

    // Base score from severity
    switch (severity) {
      case EmergencySeverity.HIGH:
        score += 10;
        break;
      case EmergencySeverity.MEDIUM:
        score += 5;
        break;
      case EmergencySeverity.LOW:
        score += 1;
        break;
    }

    // Age factors
    if (age <= this.PEDIATRIC_AGE_THRESHOLD || age >= this.ELDERLY_AGE_THRESHOLD) {
      score += 3;
    }

    // Risk factors
    if (data.existingConditions) {
      score += data.existingConditions.length;
    }
    if (this.hasHighRiskMedications(data.medications)) {
      score += 2;
    }

    return Math.min(score, 10);
  }

  private generateRecommendations(
    data: AssessEmergencyDto,
    severity: EmergencySeverity,
    category: EmergencyCategory,
    age: number,
  ): string[] {
    const recommendations: string[] = [];

    if (severity === EmergencySeverity.HIGH) {
      recommendations.push('Call emergency services (911) immediately');
      recommendations.push('Do not move the patient unless in immediate danger');
      recommendations.push('Stay on the line with emergency services');
    }

    if (data.existingConditions && data.existingConditions.length > 0) {
      recommendations.push('Inform emergency responders about: ' + data.existingConditions.join(', '));
    }

    if (data.medications && data.medications.length > 0) {
      recommendations.push('Have current medications ready: ' + data.medications.join(', '));
    }

    if (this.hasHighRiskMedications(data.medications)) {
      recommendations.push('Alert medical staff about blood thinners');
    }

    if (age <= this.PEDIATRIC_AGE_THRESHOLD) {
      recommendations.push('Inform emergency responders about pediatric case');
    }

    if (this.isAllergicReaction(data)) {
      recommendations.push('Use EpiPen if available');
    }

    // Category-specific recommendations
    switch (category) {
      case EmergencyCategory.CARDIAC:
        recommendations.push('Have the patient sit or lie down');
        recommendations.push('Loosen any tight clothing');
        break;
      case EmergencyCategory.RESPIRATORY:
        recommendations.push('Help the patient find a comfortable position for breathing');
        recommendations.push('Ensure access to fresh air');
        break;
      case EmergencyCategory.TRAUMA:
        recommendations.push('Apply direct pressure to any bleeding');
        recommendations.push('Keep the patient warm');
        break;
      case EmergencyCategory.NEUROLOGICAL:
        recommendations.push('Clear the area around the patient');
        recommendations.push('Note the time when symptoms started');
        break;
    }

    return recommendations;
  }

  private determineImmediateActions(
    severity: EmergencySeverity,
    category: EmergencyCategory,
    data: AssessEmergencyDto,
  ): string[] {
    const actions: string[] = [];

    if (severity === EmergencySeverity.HIGH) {
      actions.push('Call 911');
      actions.push('Clear immediate area');
      actions.push('Gather patient information');
    }

    if (data.description.toLowerCase().includes('not breathing')) {
      actions.push('Begin CPR if necessary');
    }

    if (this.isAllergicReaction(data)) {
      actions.push('Check airway');
      actions.push('Use EpiPen if available');
    }

    switch (category) {
      case EmergencyCategory.CARDIAC:
        actions.push('Check responsiveness');
        actions.push('Begin CPR if necessary');
        break;
      case EmergencyCategory.RESPIRATORY:
        actions.push('Check airway');
        actions.push('Position for breathing');
        break;
      case EmergencyCategory.TRAUMA:
        actions.push('Control bleeding');
        actions.push('Immobilize injured area');
        break;
      case EmergencyCategory.NEUROLOGICAL:
        actions.push('Protect from injury');
        actions.push('Monitor consciousness');
        break;
    }

    return actions;
  }
} 