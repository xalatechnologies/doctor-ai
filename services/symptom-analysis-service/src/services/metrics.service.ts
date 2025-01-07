import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  logError(context: string, error: Error | string): void {
    const errorMessage = error instanceof Error ? error.message : error;
    this.logger.error(`Error in ${context}: ${errorMessage}`);
  }

  logSuccess(context: string, details?: string): void {
    this.logger.log(`Success in ${context}${details ? `: ${details}` : ''}`);
  }

  logWarning(context: string, message: string): void {
    this.logger.warn(`Warning in ${context}: ${message}`);
  }

  logMetric(
    metricName: string,
    value: number,
    tags: Record<string, string> = {}
  ): void {
    this.logger.log(`Metric ${metricName}: ${value} ${JSON.stringify(tags)}`);
  }

  logLatency(
    operation: string,
    durationMs: number,
    success: boolean = true
  ): void {
    this.logMetric('operation_latency', durationMs, {
      operation,
      success: success.toString()
    });
  }

  incrementCounter(
    counterName: string,
    increment: number = 1,
    tags: Record<string, string> = {}
  ): void {
    this.logMetric(counterName, increment, tags);
  }

  recordValue(
    metricName: string,
    value: number,
    tags: Record<string, string> = {}
  ): void {
    this.logMetric(metricName, value, tags);
  }

  startTimer(operation: string): () => void {
    const startTime = Date.now();
    return (success: boolean = true) => {
      const duration = Date.now() - startTime;
      this.logLatency(operation, duration, success);
    };
  }
} 