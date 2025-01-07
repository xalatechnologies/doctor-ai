import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

export interface RabbitMQConfig {
  urls: string[];
  queue: string;
  queueOptions?: {
    durable?: boolean;
    [key: string]: any;
  };
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private client: ClientProxy;
  private readonly defaultConfig: RabbitMQConfig;

  constructor(private readonly configService: ConfigService) {
    this.defaultConfig = {
      urls: [this.configService.get('RABBITMQ_URL') || 'amqp://localhost:5672'],
      queue: this.configService.get('RABBITMQ_QUEUE') || 'default_queue',
      queueOptions: {
        durable: true,
      },
    };
  }

  async onModuleInit() {
    try {
      await this.initializeClient();
      await this.client.connect();
      this.logger.log('Successfully connected to RabbitMQ');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.client?.close();
    this.logger.log('RabbitMQ connection closed');
  }

  private initializeClient(config: Partial<RabbitMQConfig> = {}) {
    const finalConfig = {
      ...this.defaultConfig,
      ...config,
    };

    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: finalConfig.urls,
        queue: finalConfig.queue,
        queueOptions: finalConfig.queueOptions,
      },
    });
  }

  async emit<T>(pattern: string, data: T): Promise<void> {
    try {
      await this.client.emit(pattern, data).toPromise();
      this.logger.debug(`Successfully emitted event: ${pattern}`);
    } catch (error) {
      this.logger.error(`Failed to emit event: ${pattern}`, error);
      throw error;
    }
  }

  async send<TRequest, TResponse>(pattern: string, data: TRequest): Promise<TResponse> {
    try {
      const response = await this.client.send<TResponse, TRequest>(pattern, data).toPromise();
      this.logger.debug(`Successfully sent message: ${pattern}`);
      if (!response) {
        throw new Error('No response received');
      }
      return response;
    } catch (error) {
      this.logger.error(`Failed to send message: ${pattern}`, error);
      throw error;
    }
  }

  getClient(): ClientProxy {
    return this.client;
  }
} 