import { ConfigService } from '@nestjs/config';
import { RmqOptions, Transport } from '@nestjs/microservices';

export const getRabbitMQConfig = (configService: ConfigService): RmqOptions => {
  const url = configService.get<string>('rabbitmq.url');
  const queue = configService.get<string>('rabbitmq.queue');
  
  if (!url || !queue) {
    throw new Error('RabbitMQ configuration is missing');
  }

  return {
    transport: Transport.RMQ,
    options: {
      urls: [url],
      queue,
      queueOptions: {
        durable: true,
      },
      prefetchCount: configService.get<number>('rabbitmq.prefetchCount', 1),
    },
  };
}; 