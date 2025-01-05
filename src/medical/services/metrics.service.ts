import { Injectable } from '@nestjs/common';
import { LLMProvider } from './llm-orchestration.service';

export interface ProviderMetrics {
  totalCalls: number;
  failures: number;
  totalLatency: number;
  averageLatency: number;
  averageConfidence: number;
  responseTimeHistogram: Map<string, number>; // Buckets in ms
  confidenceHistogram: Map<string, number>;
  lastFailure: Date | undefined;
  consecutiveFailures: number;
  successRate: number;
  timeouts: number;
  errors: Map<string, number>; // Error type -> count
  tokenUsage: {
    total: number;
    average: number;
  };
  latencyDistribution: Map<string, number>;
  confidenceDistribution: Map<string, number>;
}

export interface MetricsTimeframe {
  last1h: ProviderMetrics;
  last24h: ProviderMetrics;
  last7d: ProviderMetrics;
  total: ProviderMetrics;
}

@Injectable()
export class MetricsService {
  private metrics: Map<LLMProvider, MetricsTimeframe> = new Map();
  private responseCache: Map<string, { timestamp: number; metrics: any }> = new Map();

  private readonly LATENCY_BUCKETS = [
    '0-100ms', '100-250ms', '250-500ms', 
    '500-1000ms', '1-2s', '2-5s', '>5s'
  ];

  private readonly CONFIDENCE_BUCKETS = [
    '0-0.2', '0.2-0.4', '0.4-0.6', '0.6-0.8', '0.8-1.0'
  ];

  async logProviderMetrics(
    provider: LLMProvider,
    latency: number,
    confidence: number,
    success: boolean,
    errorType?: string,
    tokenCount?: number
  ): Promise<void> {
    const timeframes = this.metrics.get(provider) || this.initializeMetricsTimeframe();
    const now = new Date();

    // Update metrics for each timeframe
    ['last1h', 'last24h', 'last7d', 'total'].forEach(timeframe => {
      const metrics = timeframes[timeframe];
      this.updateMetrics(metrics, {
        latency,
        confidence,
        success,
        errorType,
        tokenCount
      });
    });

    // Clean up old data
    this.cleanupOldMetrics();
    this.metrics.set(provider, timeframes);
  }

  private updateMetrics(
    metrics: ProviderMetrics,
    data: {
      latency: number;
      confidence: number;
      success: boolean;
      errorType?: string;
      tokenCount?: number;
    }
  ): void {
    metrics.totalCalls++;
    if (!data.success) {
      metrics.failures++;
      metrics.lastFailure = new Date();
      metrics.consecutiveFailures++;
    } else {
      metrics.consecutiveFailures = 0;
    }

    metrics.totalLatency += data.latency;
    metrics.averageLatency = metrics.totalLatency / metrics.totalCalls;
    metrics.averageConfidence = (
      (metrics.averageConfidence * (metrics.totalCalls - 1) + data.confidence) /
      metrics.totalCalls
    );
    metrics.successRate = (metrics.totalCalls - metrics.failures) / metrics.totalCalls;

    // Update histograms
    this.updateLatencyHistogram(metrics, data.latency);
    this.updateConfidenceHistogram(metrics, data.confidence);

    // Track errors
    if (data.errorType) {
      metrics.errors.set(
        data.errorType,
        (metrics.errors.get(data.errorType) || 0) + 1
      );
    }

    // Update token usage
    if (data.tokenCount) {
      metrics.tokenUsage.total += data.tokenCount;
      metrics.tokenUsage.average = metrics.tokenUsage.total / metrics.totalCalls;
    }
  }

  private updateLatencyHistogram(metrics: ProviderMetrics, latency: number): void {
    let bucket: string;
    if (latency <= 100) bucket = '0-100ms';
    else if (latency <= 250) bucket = '100-250ms';
    else if (latency <= 500) bucket = '250-500ms';
    else if (latency <= 1000) bucket = '500-1000ms';
    else if (latency <= 2000) bucket = '1-2s';
    else if (latency <= 5000) bucket = '2-5s';
    else bucket = '>5s';

    metrics.responseTimeHistogram.set(
      bucket,
      (metrics.responseTimeHistogram.get(bucket) || 0) + 1
    );
  }

  private updateConfidenceHistogram(metrics: ProviderMetrics, confidence: number): void {
    let bucket: string;
    if (confidence <= 0.2) bucket = '0-0.2';
    else if (confidence <= 0.4) bucket = '0.2-0.4';
    else if (confidence <= 0.6) bucket = '0.4-0.6';
    else if (confidence <= 0.8) bucket = '0.6-0.8';
    else bucket = '0.8-1.0';

    metrics.confidenceHistogram.set(
      bucket,
      (metrics.confidenceHistogram.get(bucket) || 0) + 1
    );
  }

  private initializeMetricsTimeframe(): MetricsTimeframe {
    const createEmptyMetrics = (): ProviderMetrics => ({
      totalCalls: 0,
      failures: 0,
      totalLatency: 0,
      averageLatency: 0,
      averageConfidence: 0,
      responseTimeHistogram: new Map(this.LATENCY_BUCKETS.map(b => [b, 0])),
      confidenceHistogram: new Map(this.CONFIDENCE_BUCKETS.map(b => [b, 0])),
      consecutiveFailures: 0,
      successRate: 1,
      timeouts: 0,
      errors: new Map(),
      tokenUsage: { total: 0, average: 0 },
      lastFailure: undefined,
      latencyDistribution: new Map(),
      confidenceDistribution: new Map()
    });

    return {
      last1h: createEmptyMetrics(),
      last24h: createEmptyMetrics(),
      last7d: createEmptyMetrics(),
      total: createEmptyMetrics()
    };
  }

  private cleanupOldMetrics(): void {
    const now = Date.now();
    this.responseCache.forEach((value, key) => {
      if (now - value.timestamp > 7 * 24 * 60 * 60 * 1000) { // 7 days
        this.responseCache.delete(key);
      }
    });
  }

  getProviderMetrics(provider: LLMProvider): MetricsTimeframe | undefined {
    return this.metrics.get(provider);
  }

  getAllMetrics(): Map<LLMProvider, MetricsTimeframe> {
    return new Map(this.metrics);
  }

  getAggregateMetrics(): {
    totalRequests: number;
    totalFailures: number;
    averageLatency: number;
    averageConfidence: number;
    successRate: number;
    errorDistribution: Map<string, number>;
    latencyDistribution: Map<string, number>;
    confidenceDistribution: Map<string, number>;
    tokenUsage: {
      total: number;
      average: number;
    };
  } {
    const aggregate = this.initializeMetricsTimeframe().total;

    this.metrics.forEach(timeframes => {
      const total = timeframes.total;
      aggregate.totalCalls += total.totalCalls;
      aggregate.failures += total.failures;
      aggregate.totalLatency += total.totalLatency;
      aggregate.tokenUsage.total += total.tokenUsage.total;

      // Merge histograms
      this.mergeHistograms(aggregate.responseTimeHistogram, total.responseTimeHistogram);
      this.mergeHistograms(aggregate.confidenceHistogram, total.confidenceHistogram);
      this.mergeHistograms(aggregate.errors, total.errors);
    });

    return {
      totalRequests: aggregate.totalCalls,
      totalFailures: aggregate.failures,
      averageLatency: aggregate.totalLatency / aggregate.totalCalls,
      averageConfidence: aggregate.averageConfidence,
      successRate: (aggregate.totalCalls - aggregate.failures) / aggregate.totalCalls,
      errorDistribution: aggregate.errors,
      latencyDistribution: aggregate.responseTimeHistogram,
      confidenceDistribution: aggregate.confidenceHistogram,
      tokenUsage: {
        total: aggregate.tokenUsage.total,
        average: aggregate.tokenUsage.total / aggregate.totalCalls
      }
    };
  }

  private mergeHistograms(target: Map<string, number>, source: Map<string, number>): void {
    source.forEach((count, bucket) => {
      target.set(bucket, (target.get(bucket) || 0) + count);
    });
  }

  async logProviderFailure(provider: LLMProvider): Promise<void> {
    const timestamp = new Date();
    const timeframes = this.getProviderMetrics(provider);
    
    if (timeframes) {
      // Update all timeframes
      ['last1h', 'last24h', 'last7d', 'total'].forEach(frame => {
        const metrics = timeframes[frame as keyof MetricsTimeframe];
        metrics.failures = (metrics.failures || 0) + 1;
        metrics.lastFailure = timestamp;
        metrics.consecutiveFailures++;
        metrics.successRate = (metrics.totalCalls - metrics.failures) / metrics.totalCalls;
      });
    } else {
      // Initialize new metrics if none exist
      const newTimeframes = this.initializeMetricsTimeframe();
      ['last1h', 'last24h', 'last7d', 'total'].forEach(frame => {
        const metrics = newTimeframes[frame as keyof MetricsTimeframe];
        metrics.failures = 1;
        metrics.lastFailure = timestamp;
        metrics.consecutiveFailures = 1;
        metrics.successRate = 0;
      });
      this.metrics.set(provider, newTimeframes);
    }
  }

  async getPrometheusMetrics() {
    const metrics = this.getAggregateMetrics();
    return {
      totalRequests: metrics.totalRequests,
      successRate: metrics.successRate,
      averageLatency: metrics.averageLatency,
      errorRate: 1 - metrics.successRate,
      activeProviders: this.metrics.size
    };
  }
} 