import { Injectable } from '@nestjs/common';
import { LLMProvider } from './llm-orchestration.service';

interface ProviderMetrics {
  successRate: number;
  averageLatency: number;
  errorRate: number;
  totalRequests: number;
  domainAccuracy: Record<string, number>;
}

@Injectable()
export class MetricsService {
  private metrics: Map<LLMProvider, ProviderMetrics> = new Map();

  constructor() {
    // Initialize metrics for each provider
    ['openai', 'anthropic', 'deepseek', 'cohere'].forEach(provider => {
      this.metrics.set(provider as LLMProvider, {
        successRate: 1,
        averageLatency: 0,
        errorRate: 0,
        totalRequests: 0,
        domainAccuracy: {}
      });
    });
  }

  async logProviderFailure(provider: LLMProvider): Promise<void> {
    const metrics = this.metrics.get(provider);
    if (metrics) {
      metrics.errorRate = (metrics.errorRate * metrics.totalRequests + 1) / (metrics.totalRequests + 1);
      metrics.successRate = 1 - metrics.errorRate;
      metrics.totalRequests++;
      this.metrics.set(provider, metrics);
    }
  }

  getProviderMetrics(provider: LLMProvider): ProviderMetrics | undefined {
    return this.metrics.get(provider);
  }

  updateProviderMetrics(
    provider: LLMProvider,
    latency: number,
    success: boolean,
    domain?: string
  ): void {
    const metrics = this.metrics.get(provider);
    if (!metrics) return;

    // Update total requests
    metrics.totalRequests++;

    // Update latency
    metrics.averageLatency = (
      metrics.averageLatency * (metrics.totalRequests - 1) + latency
    ) / metrics.totalRequests;

    // Update success/error rates
    if (success) {
      metrics.successRate = (
        metrics.successRate * (metrics.totalRequests - 1) + 1
      ) / metrics.totalRequests;
      metrics.errorRate = 1 - metrics.successRate;
    } else {
      metrics.errorRate = (
        metrics.errorRate * (metrics.totalRequests - 1) + 1
      ) / metrics.totalRequests;
      metrics.successRate = 1 - metrics.errorRate;
    }

    // Update domain accuracy if provided
    if (domain) {
      const currentAccuracy = metrics.domainAccuracy[domain] || 1;
      metrics.domainAccuracy[domain] = (
        currentAccuracy * (metrics.totalRequests - 1) + (success ? 1 : 0)
      ) / metrics.totalRequests;
    }

    this.metrics.set(provider, metrics);
  }

  getProviderRanking(domain?: string): LLMProvider[] {
    return Array.from(this.metrics.entries())
      .sort(([, a], [, b]) => {
        if (domain && a.domainAccuracy[domain] !== b.domainAccuracy[domain]) {
          return (b.domainAccuracy[domain] || 0) - (a.domainAccuracy[domain] || 0);
        }
        return b.successRate - a.successRate;
      })
      .map(([provider]) => provider);
  }

  resetMetrics(): void {
    this.metrics.clear();
    ['openai', 'anthropic', 'deepseek', 'cohere'].forEach(provider => {
      this.metrics.set(provider as LLMProvider, {
        successRate: 1,
        averageLatency: 0,
        errorRate: 0,
        totalRequests: 0,
        domainAccuracy: {}
      });
    });
  }
} 