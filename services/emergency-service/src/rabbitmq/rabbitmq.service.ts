import { Injectable, Logger } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { EmergencyPublishingException } from '@exceptions/emergency.exception';
import { EmergencyAssessment } from '@interfaces/emergency.interface';

@Injectable()
export class RabbitMQService {
  private readonly logger = new Logger(RabbitMQService.name);
  private readonly client: ClientProxy;

  constructor() {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
        queue: 'emergency_queue',
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

  async publishEmergencyAssessment(pattern: string, data: { assessment: EmergencyAssessment; originalData: any }) {
    try {
      await this.client.emit(pattern, data).toPromise();
      this.logger.log(`Successfully published emergency assessment: ${data.assessment.emergencyId}`);
    } catch (error) {
      this.logger.error('Failed to publish emergency assessment', error);
      throw new EmergencyPublishingException();
    }
  }
} 