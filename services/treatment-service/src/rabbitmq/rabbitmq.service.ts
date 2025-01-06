import { Injectable, Logger } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { TreatmentPublishingException } from '@exceptions/treatment.exception';
import { TreatmentPlan, TreatmentProgress } from '@interfaces/treatment.interface';
import { MedicationDto } from '@dto/medication.dto';

@Injectable()
export class RabbitMQService {
  private readonly logger = new Logger(RabbitMQService.name);
  private readonly client: ClientProxy;

  constructor() {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
        queue: 'treatment_queue',
        queueOptions: {
          durable: true,
        },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log('Successfully connected to RabbitMQ');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.client.close();
    this.logger.log('RabbitMQ connection closed');
  }

  async publishTreatmentEvent(pattern: string, data: {
    treatment?: TreatmentPlan;
    progress?: TreatmentProgress;
    treatmentId?: string;
    originalData?: any;
  }) {
    try {
      await this.client.emit(pattern, data).toPromise();
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
      await this.client.emit(pattern, data).toPromise();
      this.logger.log(`Successfully published emergency treatment: ${pattern}`);
    } catch (error) {
      this.logger.error('Failed to publish emergency treatment', error);
      throw new TreatmentPublishingException();
    }
  }
} 