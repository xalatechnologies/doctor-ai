import { Injectable } from '@nestjs/common';

@Injectable()
export class MockMetricsService {
  private metrics: Record<string, number> = {};

  incrementLLMRequest(provider: string, model: string): void {
    const key = `llm_request_${provider}_${model}`;
    this.metrics[key] = (this.metrics[key] || 0) + 1;
  }

  observeLLMDuration(provider: string, model: string, duration: number): void {
    const key = `llm_duration_${provider}_${model}`;
    this.metrics[key] = duration;
  }

  incrementLLMTokens(provider: string, model: string, type: string, count: number): void {
    const key = `llm_tokens_${provider}_${model}_${type}`;
    this.metrics[key] = (this.metrics[key] || 0) + count;
  }

  incrementLLMError(provider: string, model: string, errorType: string): void {
    const key = `llm_error_${provider}_${model}_${errorType}`;
    this.metrics[key] = (this.metrics[key] || 0) + 1;
  }

  logProviderSuccess(provider: string): void {
    const key = `provider_success_${provider}`;
    this.metrics[key] = (this.metrics[key] || 0) + 1;
  }

  logProviderFailure(provider: string): void {
    const key = `provider_failure_${provider}`;
    this.metrics[key] = (this.metrics[key] || 0) + 1;
  }

  recordLatency(service: string, operation: string, duration: number): void {
    const key = `latency_${service}_${operation}`;
    this.metrics[key] = duration;
  }

  logError(service: string, errorType: string): void {
    const key = `error_${service}_${errorType}`;
    this.metrics[key] = (this.metrics[key] || 0) + 1;
  }

  // Helper methods for testing
  getMetric(key: string): number {
    return this.metrics[key] || 0;
  }

  resetMetrics(): void {
    this.metrics = {};
  }
} 