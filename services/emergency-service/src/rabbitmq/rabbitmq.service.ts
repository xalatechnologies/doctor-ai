import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, ClientProxyFactory } from '@nestjs/microservices';
import { getRabbitMQConfig } from './rabbitmq.config';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private client: ClientProxy;

  constructor(private configService: ConfigService) {
    this.client = ClientProxyFactory.create(getRabbitMQConfig(configService));
  }

  async onModuleInit() {
    try {
      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error.message);
    }
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  getClient(): ClientProxy {
    return this.client;
  }

  async publishEmergencyAssessment(pattern: string, data: any) {
    try {
      return await this.client.emit(pattern, data).toPromise();
    } catch (error) {
      console.error(`Failed to publish message to ${pattern}:`, error.message);
      throw error;
    }
  }
} 