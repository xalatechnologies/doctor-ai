import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RabbitMQService {
  private readonly logger = new Logger(RabbitMQService.name);
  private readonly client: ClientProxy;

  constructor(private readonly configService: ConfigService) {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [this.configService.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672'],
        queue: this.configService.get<string>('RABBITMQ_QUEUE') || 'doctor_ai_queue',
        queueOptions: {
          durable: true,
        },
      },
    });
  }

  async publish(pattern: string, data: any): Promise<void> {
    try {
      await firstValueFrom(this.client.emit(pattern, data));
      this.logger.debug(`Published message to ${pattern}`, { data });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to publish message to ${pattern}: ${error.message}`, {
          pattern,
          data,
          error,
        });
      } else {
        this.logger.error(`Failed to publish message to ${pattern}: Unknown error`, {
          pattern,
          data,
        });
      }
      throw error;
    }
  }

  async subscribe<T>(pattern: string, callback: (data: T) => Promise<void>): Promise<void> {
    try {
      await this.client.connect();
      
      // For now, we'll just log that we're ready to receive messages
      // The actual message handling should be done using @EventPattern decorators
      // in the respective controllers/services
      this.logger.debug(`Ready to receive messages for pattern: ${pattern}`);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to subscribe to ${pattern}: ${error.message}`, {
          pattern,
          error,
        });
      } else {
        this.logger.error(`Failed to subscribe to ${pattern}: Unknown error`, {
          pattern,
        });
      }
      throw error;
    }
  }
} 