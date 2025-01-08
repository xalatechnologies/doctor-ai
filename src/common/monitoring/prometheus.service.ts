import { Injectable } from '@nestjs/common';
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class PrometheusService {
  private readonly registry: Registry;
  
  // Counters
  private readonly providerErrorCounter: Counter;
  private readonly taskCounter: Counter;
  private readonly tokenUsageCounter: Counter;

  // Histograms
  private readonly responseTimeHistogram: Histogram;
  private readonly confidenceScoreHistogram: Histogram;
  private readonly costHistogram: Histogram;

  // Gauges
  private readonly providerAvailabilityGauge: Gauge;
  private readonly costEfficiencyGauge: Gauge;

  constructor() {
    this.registry = new Registry();

    // Initialize counters
    this.providerErrorCounter = new Counter({
      name: 'llm_provider_errors_total',
      help: 'Total number of errors by LLM provider',
      labelNames: ['provider'],
      registers: [this.registry],
    });

    this.taskCounter = new Counter({
      name: 'llm_tasks_total',
      help: 'Total number of tasks processed by type',
      labelNames: ['task_type'],
      registers: [this.registry],
    });

    this.tokenUsageCounter = new Counter({
      name: 'llm_token_usage_total',
      help: 'Total number of tokens used by provider',
      labelNames: ['provider'],
      registers: [this.registry],
    });

    // Initialize histograms
    this.responseTimeHistogram = new Histogram({
      name: 'llm_response_time_seconds',
      help: 'Response time in seconds',
      labelNames: ['provider', 'task_type'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 20, 30],
      registers: [this.registry],
    });

    this.confidenceScoreHistogram = new Histogram({
      name: 'llm_confidence_score',
      help: 'Confidence scores of LLM responses',
      labelNames: ['provider', 'task_type'],
      buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      registers: [this.registry],
    });

    this.costHistogram = new Histogram({
      name: 'llm_cost_dollars',
      help: 'Cost per query in dollars',
      labelNames: ['provider', 'task_type'],
      buckets: [0.0001, 0.0005, 0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
      registers: [this.registry],
    });

    // Initialize gauges
    this.providerAvailabilityGauge = new Gauge({
      name: 'llm_provider_availability',
      help: 'Current availability status of LLM providers',
      labelNames: ['provider'],
      registers: [this.registry],
    });

    this.costEfficiencyGauge = new Gauge({
      name: 'llm_cost_efficiency',
      help: 'Cost efficiency score (confidence/cost)',
      labelNames: ['provider'],
      registers: [this.registry],
    });
  }

  incrementProviderError(provider: string): void {
    this.providerErrorCounter.labels(provider).inc();
  }

  recordTaskMetrics(taskType: string, metrics: {
    responseTime: number;
    confidence: number;
    cost: number;
  }): void {
    this.taskCounter.labels(taskType).inc();
    
    const responseTimeSeconds = metrics.responseTime / 1000;
    this.responseTimeHistogram.labels(taskType).observe(responseTimeSeconds);
    this.confidenceScoreHistogram.labels(taskType).observe(metrics.confidence);
    this.costHistogram.labels(taskType).observe(metrics.cost);

    // Calculate and record cost efficiency
    if (metrics.cost > 0) {
      const costEfficiency = metrics.confidence / metrics.cost;
      this.costEfficiencyGauge.labels(taskType).set(costEfficiency);
    }
  }

  recordModelMetrics(provider: string, metrics: {
    responseTime: number;
    confidence: number;
    cost: number;
  }): void {
    const responseTimeSeconds = metrics.responseTime / 1000;
    this.responseTimeHistogram.labels(provider).observe(responseTimeSeconds);
    this.confidenceScoreHistogram.labels(provider).observe(metrics.confidence);
    this.costHistogram.labels(provider).observe(metrics.cost);

    // Calculate and record cost efficiency
    if (metrics.cost > 0) {
      const costEfficiency = metrics.confidence / metrics.cost;
      this.costEfficiencyGauge.labels(provider).set(costEfficiency);
    }
  }

  updateProviderAvailability(provider: string, isAvailable: boolean): void {
    this.providerAvailabilityGauge.labels(provider).set(isAvailable ? 1 : 0);
  }

  recordTokenUsage(provider: string, tokens: number): void {
    this.tokenUsageCounter.labels(provider).inc(tokens);
  }

  async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }

  resetMetrics(): void {
    this.registry.resetMetrics();
  }

  clearMetrics(): void {
    this.registry.clear();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
} 