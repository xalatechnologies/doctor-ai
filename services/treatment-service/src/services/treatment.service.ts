import { Injectable, Logger } from '@nestjs/common';
import { TreatmentPlan, TreatmentProgress } from '../interfaces/treatment.interface';
import { MedicationDto } from '../dto/medication.dto';
import { TreatmentPublishingException } from '../exceptions/treatment.exception';
import { RabbitMQService } from '../../../../src/common/messaging/rabbitmq.service';

@Injectable()
export class TreatmentService {
  private readonly logger = new Logger(TreatmentService.name);

  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async publishTreatmentEvent(pattern: string, data: {
    treatment?: TreatmentPlan;
    progress?: TreatmentProgress;
    treatmentId?: string;
    originalData?: any;
  }) {
    try {
      await this.rabbitMQService.emit(pattern, data);
      this.logger.log(`Successfully published treatment event: ${pattern}`);
    } catch (error) {
      this.logger.error('Failed to publish treatment event', error);
      throw new TreatmentPublishingException();
    }
  }

  async publishEmergencyTreatment(pattern: string, data: {
    emergencyId: string;
    recommendedActions: string[];
    medications: MedicationDto[];
  }) {
    try {
      await this.rabbitMQService.emit(pattern, data);
      this.logger.log(`Successfully published emergency treatment: ${pattern}`);
    } catch (error) {
      this.logger.error('Failed to publish emergency treatment', error);
      throw new TreatmentPublishingException();
    }
  }
} 