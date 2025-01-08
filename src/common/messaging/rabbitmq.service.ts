import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { MetricsService } from '../metrics/metrics.service';

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

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
  ) {
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
      this.metricsService.setConnectionStatus(true);
      this.logger.log('Successfully connected to RabbitMQ');
    } catch (error) {
      this.metricsService.setConnectionStatus(false);
      this.logger.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.client?.close();
    this.metricsService.setConnectionStatus(false);
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
    const startTime = process.hrtime();
    try {
      await this.client.emit(pattern, data).toPromise();

      // Record metrics
      this.metricsService.incrementMessageEmit(pattern);
      const elapsed = process.hrtime(startTime);
      const duration = (elapsed[0] * 1e9 + elapsed[1]) / 1e9; // Convert to seconds
      this.metricsService.observeMessageDuration('emit', pattern, duration);

      this.logger.debug(`Successfully emitted event: ${pattern}`);
    } catch (error) {
      this.metricsService.incrementMessageError(
        'emit',
        error.name || 'unknown',
      );
      this.logger.error(`Failed to emit event: ${pattern}`, error);
      throw error;
    }
  }

  async send<TRequest, TResponse>(
    pattern: string,
    data: TRequest,
  ): Promise<TResponse> {
    const startTime = process.hrtime();
    try {
      const response = await this.client
        .send<TResponse, TRequest>(pattern, data)
        .toPromise();

      // Record metrics
      this.metricsService.incrementMessageSend(pattern);
      const elapsed = process.hrtime(startTime);
      const duration = (elapsed[0] * 1e9 + elapsed[1]) / 1e9; // Convert to seconds
      this.metricsService.observeMessageDuration('send', pattern, duration);

      this.logger.debug(`Successfully sent message: ${pattern}`);
      if (!response) {
        throw new Error('No response received');
      }
      return response;
    } catch (error) {
      this.metricsService.incrementMessageError(
        'send',
        error.name || 'unknown',
      );
      this.logger.error(`Failed to send message: ${pattern}`, error);
      throw error;
    }
  }

  getClient(): ClientProxy {
    return this.client;
  }
}
