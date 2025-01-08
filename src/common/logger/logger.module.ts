import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerService } from './logger.service';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [ConfigModule, MetricsModule],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
