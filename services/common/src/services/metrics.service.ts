import { Injectable, OnModuleInit } from '@nestjs/common';
import { Registry, Counter, Histogram, Gauge } from 'prom-client';
import { LoggerService } from './logger.service';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: Registry;
  private readonly requestCounter: Counter<string>;
  private readonly requestDuration: Histogram<string>;
  private readonly errorCounter: Counter<string>;
  private readonly activeConnections: Gauge<string>;
  private readonly providerLatency: Histogram<string>;
  private readonly providerErrors: Counter<string>;
  private readonly cacheHits: Counter<string>;
  private readonly cacheMisses: Counter<string>;

  constructor(private readonly logger: LoggerService) {
    this.registry = new Registry();

    // Request metrics
    this.requestCounter = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status']
    });

    this.requestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route'],
      buckets: [0.1, 0.5, 1, 2, 5]
    });

    // Error metrics
    this.errorCounter = new Counter({
      name: 'application_errors_total',
      help: 'Total number of application errors',
      labelNames: ['type', 'service']
    });

    // Connection metrics
    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections'
    });

    // Provider metrics
    this.providerLatency = new Histogram({
      name: 'provider_request_duration_seconds',
      help: 'Duration of requests to external providers',
      labelNames: ['provider'],
      buckets: [0.1, 0.5, 1, 2, 5, 10]
    });

    this.providerErrors = new Counter({
      name: 'provider_errors_total',
      help: 'Total number of provider errors',
      labelNames: ['provider', 'error_type']
    });

    // Cache metrics
    this.cacheHits = new Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_type']
    });

    this.cacheMisses = new Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache_type']
    });

    // Register all metrics
    this.registry.registerMetric(this.requestCounter);
    this.registry.registerMetric(this.requestDuration);
    this.registry.registerMetric(this.errorCounter);
    this.registry.registerMetric(this.activeConnections);
    this.registry.registerMetric(this.providerLatency);
    this.registry.registerMetric(this.providerErrors);
    this.registry.registerMetric(this.cacheHits);
    this.registry.registerMetric(this.cacheMisses);
  }

  async onModuleInit() {
    try {
      await this.registry.setDefaultLabels({
        app: 'medical-ai',
        environment: process.env.NODE_ENV || 'development'
      });
      this.logger.info('Metrics registry initialized', { service: 'MetricsService' });
    } catch (error) {
      this.logger.error('Failed to initialize metrics registry', { error, service: 'MetricsService' });
      throw error;
    }
  }

  // Request tracking
  trackRequest(method: string, route: string, status: number, duration: number) {
    this.requestCounter.labels(method, route, status.toString()).inc();
    this.requestDuration.labels(method, route).observe(duration);
  }

  // Error tracking
  trackError(type: string, service: string) {
    this.errorCounter.labels(type, service).inc();
  }

  // Connection tracking
  incrementConnections() {
    this.activeConnections.inc();
  }

  decrementConnections() {
    this.activeConnections.dec();
  }

  // Provider metrics
  startProviderTimer(provider: string): () => void {
    return this.providerLatency.labels(provider).startTimer();
  }

  trackProviderError(provider: string, errorType: string) {
    this.providerErrors.labels(provider, errorType).inc();
  }

  // Cache metrics
  trackCacheHit(type: string) {
    this.cacheHits.labels(type).inc();
  }

  trackCacheMiss(type: string) {
    this.cacheMisses.labels(type).inc();
  }

  // Get all metrics
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  // Reset metrics (useful for testing)
  async resetMetrics() {
    this.registry.resetMetrics();
  }

  // Get specific metrics
  private async getMetricValue(metric: Counter<string> | Gauge<string>, labels: Record<string, string | number>): Promise<number> {
    const value = await metric.get();
    const matchingMetric = value.values.find(v => 
      Object.entries(labels).every(([key, val]) => v.labels[key] === String(val))
    );
    return matchingMetric ? Number(matchingMetric.value) : 0;
  }

  async getRequestCount(method: string, route: string, status: string): Promise<number> {
    return this.getMetricValue(this.requestCounter, { method, route, status });
  }

  async getErrorCount(type: string, service: string): Promise<number> {
    return this.getMetricValue(this.errorCounter, { type, service });
  }

  async getActiveConnections(): Promise<number> {
    const value = await this.activeConnections.get();
    return value.values[0] ? Number(value.values[0].value) : 0;
  }

  async getProviderErrorCount(provider: string, errorType: string): Promise<number> {
    return this.getMetricValue(this.providerErrors, { provider, error_type: errorType });
  }

  async getCacheHitRate(type: string): Promise<number> {
    const hits = await this.getMetricValue(this.cacheHits, { cache_type: type });
    const misses = await this.getMetricValue(this.cacheMisses, { cache_type: type });
    const total = hits + misses;
    return total > 0 ? hits / total : 0;
  }
} 