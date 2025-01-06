import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, ClientProxyFactory } from '@nestjs/microservices';
import { getRabbitMQConfig } from './rabbitmq.config';
import { lastValueFrom } from 'rxjs';
import { TreatmentPlan, TreatmentAnalysis, EmergencyTreatment } from '@interfaces/treatment.interface';

@Injectable()
export class RabbitMQService {
  private readonly logger = new Logger(RabbitMQService.name);
  private readonly client: ClientProxy;

  constructor(private readonly configService: ConfigService) {
    this.client = ClientProxyFactory.create(getRabbitMQConfig(configService));
  }

  async onApplicationBootstrap() {
    try {
      await this.client.connect();
      this.logger.log('Successfully connected to RabbitMQ');
    } catch (err) {
      this.logger.error('Failed to connect to RabbitMQ', err);
    }
  }

  async publishTreatmentPlan(pattern: string, treatmentPlan: TreatmentPlan): Promise<void> {
    try {
      await lastValueFrom(this.client.emit(pattern, treatmentPlan));
      this.logger.debug(`Published treatment plan with ID ${treatmentPlan.id} to ${pattern}`);
    } catch (err) {
      this.logger.error(`Failed to publish treatment plan to ${pattern}`, err);
      throw err;
    }
  }

  async publishTreatmentAnalysis(pattern: string, analysis: TreatmentAnalysis): Promise<void> {
    try {
      await lastValueFrom(this.client.emit(pattern, analysis));
      this.logger.debug(`Published treatment analysis for plan ${analysis.treatmentPlanId} to ${pattern}`);
    } catch (err) {
      this.logger.error(`Failed to publish treatment analysis to ${pattern}`, err);
      throw err;
    }
  }

  async publishEmergencyTreatment(pattern: string, treatment: EmergencyTreatment): Promise<void> {
    try {
      await lastValueFrom(this.client.emit(pattern, treatment));
      this.logger.debug(`Published emergency treatment for ID ${treatment.emergencyId} to ${pattern}`);
    } catch (err) {
      this.logger.error(`Failed to publish emergency treatment to ${pattern}`, err);
      throw err;
    }
  }

  async sendRequest<T>(pattern: string, data: any): Promise<T> {
    try {
      return await lastValueFrom(this.client.send<T>(pattern, data));
    } catch (err) {
      this.logger.error(`Failed to send request to ${pattern}`, err);
      throw err;
    }
  }

  async onApplicationShutdown() {
    await this.client.close();
    this.logger.log('RabbitMQ connection closed');
  }
} 