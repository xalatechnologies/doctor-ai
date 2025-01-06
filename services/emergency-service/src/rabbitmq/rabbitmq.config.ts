import { Transport, RmqOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

export const getRabbitMQConfig = (configService: ConfigService): RmqOptions => ({
  transport: Transport.RMQ,
  options: {
    urls: [configService.get<string>('rabbitmq.url') || 'amqp://localhost:5672'],
    queue: configService.get<string>('rabbitmq.queue') || 'emergency_queue',
    queueOptions: {
      durable: true,
    },
    prefetchCount: 1,
    persistent: true,
    noAck: false,
  },
}); 