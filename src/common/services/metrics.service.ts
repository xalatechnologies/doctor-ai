import { Injectable } from '@nestjs/common';

interface Metric {
  operation: string;
  timestamp: Date;
  duration?: number;
  success?: boolean;
  metadata?: Record<string, any>;
}

@Injectable()
export class MetricsService {
  async recordMetric(metric: Metric): Promise<void> {
    // Mock implementation for testing
    console.log('Recording metric:', metric);
  }
} 