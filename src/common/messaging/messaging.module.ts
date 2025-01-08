import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQService } from './rabbitmq.service';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [ConfigModule, MetricsModule],
  providers: [RabbitMQService],
  exports: [RabbitMQService],
})
export class MessagingModule {}
