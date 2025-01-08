import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetricsService } from './metrics.service';
import { PrometheusService } from '../monitoring/prometheus.service';

@Module({
  imports: [ConfigModule],
  providers: [MetricsService, PrometheusService],
  exports: [MetricsService],
})
export class MetricsModule {}
