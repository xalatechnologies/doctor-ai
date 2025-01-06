import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQService } from '@rabbitmq/rabbitmq.service';
import { TreatmentPlan, TreatmentAnalysis, EmergencyTreatment, TreatmentProgress, TreatmentStatus } from '@interfaces/treatment.interface';
import { CreateTreatmentPlanDto } from '@dto/create-treatment.dto';
import { UpdateTreatmentPlanDto, UpdateTreatmentProgressDto } from '@dto/update-treatment.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TreatmentService {
  private readonly logger = new Logger(TreatmentService.name);
  private readonly treatments = new Map<string, TreatmentPlan>();
  private readonly progress = new Map<string, TreatmentProgress>();

  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async createTreatmentPlan(dto: CreateTreatmentPlanDto): Promise<TreatmentPlan> {
    const treatmentPlan: TreatmentPlan = {
      id: uuidv4(),
      patientId: dto.patientId,
      diagnosis: dto.diagnosis,
      medications: dto.medications,
      followUpSchedule: dto.followUpSchedule,
      recommendations: dto.recommendations,
      lifestyle: dto.lifestyle,
      notes: dto.notes,
      status: TreatmentStatus.ACTIVE,
      startDate: dto.startDate,
      endDate: dto.endDate,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.treatments.set(treatmentPlan.id, treatmentPlan);
    
    await this.rabbitMQService.publishTreatmentPlan('treatment.created', treatmentPlan);
    this.logger.log(`Created treatment plan ${treatmentPlan.id} for patient ${treatmentPlan.patientId}`);
    
    return treatmentPlan;
  }

  async updateTreatmentPlan(id: string, dto: UpdateTreatmentPlanDto): Promise<TreatmentPlan> {
    const existingPlan = this.treatments.get(id);
    if (!existingPlan) {
      throw new Error(`Treatment plan ${id} not found`);
    }

    const updatedPlan: TreatmentPlan = {
      ...existingPlan,
      ...dto,
      updatedAt: new Date()
    };

    this.treatments.set(id, updatedPlan);
    
    await this.rabbitMQService.publishTreatmentPlan('treatment.updated', updatedPlan);
    this.logger.log(`Updated treatment plan ${id}`);
    
    return updatedPlan;
  }

  async updateTreatmentProgress(id: string, dto: UpdateTreatmentProgressDto): Promise<TreatmentProgress> {
    const existingPlan = this.treatments.get(id);
    if (!existingPlan) {
      throw new Error(`Treatment plan ${id} not found`);
    }

    const treatmentProgress: TreatmentProgress = {
      treatmentPlanId: id,
      symptoms: dto.symptoms,
      medicationAdherence: dto.medicationAdherence,
      notes: dto.notes,
      updatedAt: new Date()
    };

    this.progress.set(id, treatmentProgress);

    const analysis = await this.analyzeTreatmentProgress(treatmentProgress);
    await this.rabbitMQService.publishTreatmentAnalysis('treatment.analyzed', analysis);
    
    this.logger.log(`Updated progress for treatment plan ${id}`);
    
    return treatmentProgress;
  }

  private async analyzeTreatmentProgress(progress: TreatmentProgress): Promise<TreatmentAnalysis> {
    const plan = this.treatments.get(progress.treatmentPlanId);
    if (!plan) {
      throw new Error(`Treatment plan ${progress.treatmentPlanId} not found`);
    }

    // Analyze symptom improvement
    const symptomImprovement = progress.symptoms.every(s => s.severity < s.previousSeverity);
    
    // Check medication adherence
    const goodAdherence = progress.medicationAdherence.every(m => m.adherenceRate >= 0.8);

    // Determine if plan needs adjustment
    const needsAdjustment = !symptomImprovement || !goodAdherence;

    const analysis: TreatmentAnalysis = {
      treatmentPlanId: progress.treatmentPlanId,
      patientId: plan.patientId,
      symptomImprovement,
      medicationAdherence: goodAdherence,
      needsAdjustment,
      recommendations: this.generateRecommendations(symptomImprovement, goodAdherence),
      analyzedAt: new Date()
    };

    return analysis;
  }

  private generateRecommendations(symptomImprovement: boolean, goodAdherence: boolean): string[] {
    const recommendations: string[] = [];

    if (!symptomImprovement && !goodAdherence) {
      recommendations.push(
        'Poor medication adherence may be contributing to lack of symptom improvement',
        'Consider simplifying medication schedule',
        'Schedule follow-up appointment to discuss barriers to medication adherence'
      );
    } else if (!symptomImprovement && goodAdherence) {
      recommendations.push(
        'Despite good medication adherence, symptoms are not improving',
        'Consider adjusting medication dosage or changing medications',
        'Schedule follow-up appointment to reassess treatment plan'
      );
    } else if (symptomImprovement && !goodAdherence) {
      recommendations.push(
        'Symptoms are improving but medication adherence could be better',
        'Discuss importance of consistent medication adherence',
        'Identify and address any barriers to medication adherence'
      );
    } else {
      recommendations.push(
        'Treatment plan is working well',
        'Continue current treatment plan',
        'Schedule routine follow-up appointment'
      );
    }

    return recommendations;
  }

  async handleEmergencyAssessment(emergencyId: string, assessment: any): Promise<void> {
    const emergencyTreatment: EmergencyTreatment = {
      emergencyId,
      recommendedActions: this.generateEmergencyRecommendations(assessment),
      medications: this.determineEmergencyMedications(assessment),
      createdAt: new Date()
    };

    await this.rabbitMQService.publishEmergencyTreatment('emergency.treatment', emergencyTreatment);
    this.logger.log(`Published emergency treatment for emergency ${emergencyId}`);
  }

  private generateEmergencyRecommendations(assessment: any): string[] {
    // Logic to generate emergency treatment recommendations based on assessment
    const recommendations: string[] = [];
    
    if (assessment.severity === 'HIGH') {
      recommendations.push(
        'Immediate medical intervention required',
        'Prepare for possible hospital admission',
        'Monitor vital signs continuously'
      );
    } else if (assessment.severity === 'MEDIUM') {
      recommendations.push(
        'Urgent medical attention needed',
        'Monitor condition closely',
        'Prepare for escalation if symptoms worsen'
      );
    } else {
      recommendations.push(
        'Provide appropriate medication',
        'Monitor for any changes in condition',
        'Schedule follow-up if needed'
      );
    }

    return recommendations;
  }

  private determineEmergencyMedications(assessment: any): any[] {
    // Logic to determine appropriate emergency medications based on assessment
    const medications = [];

    switch (assessment.condition) {
      case 'ALLERGIC_REACTION':
        medications.push({
          name: 'Epinephrine',
          dosage: '0.3mg',
          route: 'IM',
          frequency: 'Once, repeat if needed after 5-15 minutes'
        });
        break;
      case 'ASTHMA_ATTACK':
        medications.push({
          name: 'Albuterol',
          dosage: '2.5mg',
          route: 'Nebulizer',
          frequency: 'Every 20 minutes for first hour'
        });
        break;
      default:
        medications.push({
          name: 'To be determined by attending physician',
          dosage: 'As prescribed',
          route: 'As prescribed',
          frequency: 'As prescribed'
        });
    }

    return medications;
  }
} 