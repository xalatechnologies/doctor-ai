import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrometheusService } from '../monitoring/prometheus.service';

export interface TaskMetrics {
  responseTime: number;
  confidence: number;
  cost: number;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prometheusService: PrometheusService,
  ) {}

  /**
   * Records latency metrics for a specific service and operation.
   * 
   * @param service - The service name
   * @param operation - The operation name
   * @param duration - The duration in seconds
   */
  public recordLatency(service: string, operation: string, duration: number): void {
    try {
      this.prometheusService.recordTaskMetrics(operation, {
        responseTime: duration * 1000,
        confidence: 1,
        cost: 0, // No cost for internal operations
      });
    } catch (error) {
      console.error(`Error recording latency for ${service}.${operation}:`, error);
    }
  }

  /**
   * Records task metrics.
   * 
   * @param taskType - The type of task
   * @param metrics - The metrics to record
   */
  public recordTaskMetrics(taskType: string, metrics: TaskMetrics): void {
    try {
      this.prometheusService.recordTaskMetrics(taskType, metrics);
    } catch (error) {
      console.error(`Error recording task metrics for ${taskType}:`, error);
    }
  }

  /**
   * Records model metrics.
   * 
   * @param provider - The provider name
   * @param metrics - The metrics to record
   */
  public recordModelMetrics(provider: string, metrics: TaskMetrics): void {
    try {
      this.prometheusService.recordModelMetrics(provider, metrics);
    } catch (error) {
      console.error(`Error recording model metrics for ${provider}:`, error);
    }
  }

  /**
   * Records token usage for a provider.
   * 
   * @param provider - The provider name
   * @param tokens - The number of tokens used
   */
  public recordTokenUsage(provider: string, tokens: number): void {
    try {
      this.prometheusService.recordTokenUsage(provider, tokens);
    } catch (error) {
      console.error(`Error recording token usage for ${provider}:`, error);
    }
  }

  /**
   * Logs an error for a specific service.
   * 
   * @param service - The service name
   * @param errorType - The type of error
   */
  public logError(service: string, errorType: string): void {
    try {
      this.prometheusService.incrementProviderError(`${service}_${errorType}`);
    } catch (error) {
      console.error(`Error logging error for ${service}:`, error);
    }
  }

  /**
   * Increments the error counter for a provider.
   * 
   * @param provider - The provider name
   */
  public incrementProviderError(provider: string): void {
    try {
      this.prometheusService.incrementProviderError(provider);
    } catch (error) {
      console.error(`Error incrementing error count for ${provider}:`, error);
    }
  }

  /**
   * Updates the availability status of a provider.
   * 
   * @param provider - The provider name
   * @param isAvailable - Whether the provider is available
   */
  public updateProviderAvailability(provider: string, isAvailable: boolean): void {
    try {
      this.prometheusService.updateProviderAvailability(provider, isAvailable);
    } catch (error) {
      console.error(`Error updating provider availability for ${provider}:`, error);
    }
  }

  /**
   * Gets the current metrics in Prometheus format.
   * 
   * @returns The metrics string
   */
  public async getMetrics(): Promise<string> {
    try {
      return await this.prometheusService.getMetrics();
    } catch (error) {
      console.error('Error getting metrics:', error);
      throw error;
    }
  }

  /**
   * Resets all metrics to their initial values.
   */
  public resetMetrics(): void {
    try {
      this.prometheusService.resetMetrics();
    } catch (error) {
      console.error('Error resetting metrics:', error);
    }
  }

  /**
   * Clears all metrics.
   */
  public clearMetrics(): void {
    try {
      this.prometheusService.clearMetrics();
    } catch (error) {
      console.error('Error clearing metrics:', error);
    }
  }

  public incrementLLMTokens(
    provider: string,
    model: string,
    type: 'prompt' | 'completion',
    tokens: number,
  ): void {
    // TODO: Implement actual metrics recording
    this.logger.debug(`Incrementing ${tokens} ${type} tokens for ${provider} ${model}`);
  }

  public observeLLMDuration(provider: string, model: string, duration: number): void {
    // TODO: Implement actual metrics recording
    this.logger.debug(`Recording duration ${duration}s for ${provider} ${model}`);
  }

  public incrementLLMError(provider: string, model: string, errorType: string): void {
    // TODO: Implement actual metrics recording
    this.logger.debug(`Recording error ${errorType} for ${provider} ${model}`);
  }

  public setConnectionStatus(isConnected: boolean): void {
    try {
      this.prometheusService.updateProviderAvailability('rabbitmq', isConnected);
    } catch (error) {
      console.error('Error setting connection status:', error);
    }
  }
}
