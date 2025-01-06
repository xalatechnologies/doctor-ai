import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { TreatmentPlan, TreatmentProgress, TreatmentStatus } from '@interfaces/treatment.interface';
import { CreateTreatmentDto } from '@dto/create-treatment.dto';
import { UpdateTreatmentProgressDto } from '@dto/update-treatment-progress.dto';
import { TreatmentNotFoundException, InvalidTreatmentDataException } from '@exceptions/treatment.exception';
import { RabbitMQService } from '@rabbitmq/rabbitmq.service';

@Injectable()
export class TreatmentService {
  private readonly logger = new Logger(TreatmentService.name);
  private readonly treatments = new Map<string, TreatmentPlan>();
  private readonly progress = new Map<string, TreatmentProgress[]>();

  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async createTreatment(data: CreateTreatmentDto): Promise<TreatmentPlan> {
    try {
      this.validateTreatmentData(data);
      const treatment = await this.createTreatmentPlan(data);

      try {
        await this.rabbitMQService.publishTreatmentEvent('treatment.created', {
          treatment,
          originalData: data,
        });
      } catch (error) {
        this.logger.warn('Failed to publish treatment creation event, but continuing execution', error);
      }

      return treatment;
    } catch (error) {
      this.logger.error('Failed to create treatment', error);
      if (error instanceof InvalidTreatmentDataException) {
        throw error;
      }
      throw new Error('Failed to create treatment plan');
    }
  }

  async updateTreatmentProgress(
    treatmentId: string,
    data: UpdateTreatmentProgressDto,
  ): Promise<TreatmentProgress> {
    const treatment = this.treatments.get(treatmentId);
    if (!treatment) {
      throw new TreatmentNotFoundException(`Treatment with ID ${treatmentId} not found`);
    }

    try {
      const progress = await this.createProgressEntry(treatmentId, data);
      treatment.status = data.status;
      this.treatments.set(treatmentId, treatment);

      const progressList = this.progress.get(treatmentId) || [];
      progressList.push(progress);
      this.progress.set(treatmentId, progressList);

      try {
        await this.rabbitMQService.publishTreatmentEvent('treatment.progress.updated', {
          treatmentId,
          progress,
          treatment,
        });
      } catch (error) {
        this.logger.warn('Failed to publish treatment progress update event, but continuing execution', error);
      }

      return progress;
    } catch (error) {
      this.logger.error('Failed to update treatment progress', error);
      throw new Error('Failed to update treatment progress');
    }
  }

  private validateTreatmentData(data: CreateTreatmentDto): void {
    if (!data.patientId || !data.description || !data.instructions || data.instructions.length === 0) {
      throw new InvalidTreatmentDataException('Missing required treatment data');
    }
  }

  private async createTreatmentPlan(data: CreateTreatmentDto): Promise<TreatmentPlan> {
    this.validateDateRange(data.startDate, data.endDate, data.duration);

    const treatment: TreatmentPlan = {
      id: uuidv4(),
      patientId: data.patientId,
      type: data.type,
      description: data.description,
      priority: data.priority,
      medications: data.medications || [],
      instructions: data.instructions,
      precautions: data.precautions || [],
      contraindications: data.contraindications || [],
      duration: data.duration,
      frequency: data.frequency,
      status: TreatmentStatus.PENDING,
      startDate: data.startDate,
      endDate: data.endDate || this.calculateEndDate(data.startDate, data.duration),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.treatments.set(treatment.id, treatment);
    return treatment;
  }

  private async createProgressEntry(
    treatmentId: string,
    data: UpdateTreatmentProgressDto,
  ): Promise<TreatmentProgress> {
    const progress: TreatmentProgress = {
      id: uuidv4(),
      treatmentPlanId: treatmentId,
      date: new Date().toISOString(),
      notes: data.notes,
      observations: data.observations || [],
      complications: data.complications || [],
      adjustments: data.adjustments || [],
      status: data.status,
      nextCheckupDate: data.nextCheckupDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return progress;
  }

  private calculateEndDate(startDate: string, durationInDays: number): string {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationInDays);
    return endDate.toISOString();
  }

  async getTreatmentPlan(treatmentId: string): Promise<TreatmentPlan> {
    const treatment = this.treatments.get(treatmentId);
    if (!treatment) {
      throw new TreatmentNotFoundException(`Treatment with ID ${treatmentId} not found`);
    }
    return treatment;
  }

  async getTreatmentProgress(treatmentId: string): Promise<TreatmentProgress[]> {
    const treatment = await this.getTreatmentPlan(treatmentId);
    const progressList = this.progress.get(treatmentId) || [];
    return progressList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getTreatmentsByPatient(patientId: string): Promise<TreatmentPlan[]> {
    const patientTreatments: TreatmentPlan[] = [];
    for (const treatment of this.treatments.values()) {
      if (treatment.patientId === patientId) {
        patientTreatments.push(treatment);
      }
    }
    return patientTreatments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getActiveTreatments(): Promise<TreatmentPlan[]> {
    const activeTreatments: TreatmentPlan[] = [];
    const now = new Date();
    
    for (const treatment of this.treatments.values()) {
      const endDate = new Date(treatment.endDate);
      if (endDate >= now && treatment.status !== TreatmentStatus.COMPLETED) {
        activeTreatments.push(treatment);
      }
    }
    
    return activeTreatments.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
  }

  private validateDateRange(startDate: string, endDate?: string, duration?: number): void {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      throw new InvalidTreatmentDataException('Invalid start date');
    }

    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        throw new InvalidTreatmentDataException('Invalid end date');
      }
      if (end <= start) {
        throw new InvalidTreatmentDataException('End date must be after start date');
      }
    }

    if (duration && duration <= 0) {
      throw new InvalidTreatmentDataException('Duration must be positive');
    }
  }
} 