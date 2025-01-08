import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram, register } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly symptomAnalysisCounter: Counter<string>;
  private readonly analysisLatencyGauge: Gauge<string>;
  private readonly providerSuccessCounter: Counter<string>;
  private readonly providerFailureCounter: Counter<string>;
  private readonly errorCounter: Counter<string>;
  private readonly latencyHistogram: Gauge<string>;
  private readonly llmRequestCounter: Counter<string>;
  private readonly llmDurationHistogram: Histogram<string>;
  private readonly llmTokenCounter: Counter<string>;
  private readonly llmErrorCounter: Counter<string>;
  private readonly logCounter: Counter<string>;
  private readonly messageDurationHistogram: Histogram<string>;
  private readonly logDurationHistogram: Histogram<string>;
  private readonly genericErrorCounter: Counter<string>;
  private readonly messageCounter: Counter<string>;
  private readonly messageErrorCounter: Counter<string>;
  private readonly connectionStatusGauge: Gauge<string>;

  constructor() {
    this.symptomAnalysisCounter = new Counter({
      name: 'symptom_analysis_total',
      help: 'Total number of symptom analyses performed',
    });

    this.analysisLatencyGauge = new Gauge({
      name: 'symptom_analysis_latency_seconds',
      help: 'Latency of symptom analysis in seconds',
    });

    this.providerSuccessCounter = new Counter({
      name: 'llm_provider_success_total',
      help: 'Total successful LLM provider calls',
      labelNames: ['provider'],
    });

    this.providerFailureCounter = new Counter({
      name: 'llm_provider_failure_total',
      help: 'Total failed LLM provider calls',
      labelNames: ['provider'],
    });

    this.errorCounter = new Counter({
      name: 'error_total',
      help: 'Total number of errors',
      labelNames: ['service', 'type'],
    });

    this.latencyHistogram = new Gauge({
      name: 'service_latency_seconds',
      help: 'Service operation latency in seconds',
      labelNames: ['service', 'operation'],
    });

    this.llmRequestCounter = new Counter({
      name: 'llm_requests_total',
      help: 'Total number of LLM API requests',
      labelNames: ['provider', 'model'],
    });

    this.llmDurationHistogram = new Histogram({
      name: 'llm_request_duration_seconds',
      help: 'Duration of LLM API requests',
      labelNames: ['provider', 'model'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    });

    this.llmTokenCounter = new Counter({
      name: 'llm_tokens_total',
      help: 'Total number of tokens used',
      labelNames: ['provider', 'model', 'type'],
    });

    this.llmErrorCounter = new Counter({
      name: 'llm_errors_total',
      help: 'Total number of LLM API errors',
      labelNames: ['provider', 'model', 'error_type'],
    });

    this.logCounter = new Counter({
      name: 'logger_messages_total',
      help: 'Total number of log messages by level',
      labelNames: ['level'],
    });

    this.messageDurationHistogram = new Histogram({
      name: 'message_duration_seconds',
      help: 'Duration of message operations',
      labelNames: ['operation', 'pattern'],
      buckets: [0.1, 0.5, 1, 2, 5],
    });

    this.logDurationHistogram = new Histogram({
      name: 'logger_operation_duration_seconds',
      help: 'Duration of logging operations',
      labelNames: ['operation'],
      buckets: [0.1, 0.5, 1, 2, 5],
    });

    this.genericErrorCounter = new Counter({
      name: 'generic_errors_total',
      help: 'Total number of generic errors',
    });

    this.messageCounter = new Counter({
      name: 'message_operations_total',
      help: 'Total number of message operations',
      labelNames: ['operation', 'pattern'],
    });

    this.messageErrorCounter = new Counter({
      name: 'message_errors_total',
      help: 'Total number of message operation errors',
      labelNames: ['operation', 'error_type'],
    });

    this.connectionStatusGauge = new Gauge({
      name: 'rabbitmq_connection_status',
      help: 'Current connection status to RabbitMQ (1 for connected, 0 for disconnected)',
    });
  }

  incrementLLMRequest(provider: string, model: string): void {
    this.llmRequestCounter.labels(provider, model).inc();
  }

  observeLLMDuration(provider: string, model: string, duration: number): void {
    this.llmDurationHistogram.labels(provider, model).observe(duration);
  }

  incrementLLMTokens(
    provider: string,
    model: string,
    type: 'prompt' | 'completion',
    count: number,
  ): void {
    this.llmTokenCounter.labels(provider, model, type).inc(count);
  }

  incrementAnalysisCount(): void {
    this.symptomAnalysisCounter.inc();
  }

  recordAnalysisLatency(seconds: number): void {
    this.analysisLatencyGauge.set(seconds);
  }

  logProviderSuccess(provider: string): void {
    this.providerSuccessCounter.labels(provider).inc();
  }

  logProviderFailure(provider: string): void {
    this.providerFailureCounter.labels(provider).inc();
  }

  logError(service: string, type: string): void {
    this.errorCounter.labels(service, type).inc();
  }

  recordLatency(service: string, operation: string, seconds: number): void {
    this.latencyHistogram.labels(service, operation).set(seconds);
  }

  getProviderMetrics(provider: string) {
    return {
      success: Number(this.providerSuccessCounter.labels(provider)),
      failures: Number(this.providerFailureCounter.labels(provider)),
    };
  }

  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  incrementLLMError(provider: string, model: string, errorType: string): void {
    this.llmErrorCounter.labels(provider, model, errorType).inc();
  }

  incrementLogCount(level: string): void {
    this.logCounter.labels(level).inc();
  }

  observeMessageDuration(
    operation: string,
    pattern: string,
    duration: number,
  ): void {
    this.messageDurationHistogram.labels(operation, pattern).observe(duration);
  }

  observeLogDuration(operation: string, duration: number): void {
    this.logDurationHistogram.labels(operation).observe(duration);
  }

  incrementErrorCount(): void {
    this.genericErrorCounter.inc();
  }

  incrementMessageEmit(pattern: string): void {
    this.messageCounter.labels('emit', pattern).inc();
  }

  incrementMessageSend(pattern: string): void {
    this.messageCounter.labels('send', pattern).inc();
  }

  incrementMessageError(operation: string, errorType: string): void {
    this.messageErrorCounter.labels(operation, errorType).inc();
  }

  setConnectionStatus(isConnected: boolean): void {
    this.connectionStatusGauge.set(isConnected ? 1 : 0);
  }
}
