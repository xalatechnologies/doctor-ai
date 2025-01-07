import { Injectable, OnModuleInit } from '@nestjs/common';
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: Registry;

  // Logger metrics
  private readonly logCounter: Counter;
  private readonly logDurationHistogram: Histogram;
  private readonly errorCounter: Counter;

  // LLM metrics
  private readonly llmRequestCounter: Counter;
  private readonly llmDurationHistogram: Histogram;
  private readonly llmErrorCounter: Counter;
  private readonly llmTokenCounter: Counter;

  // Messaging metrics
  private readonly messageEmitCounter: Counter;
  private readonly messageSendCounter: Counter;
  private readonly messageDurationHistogram: Histogram;
  private readonly connectionGauge: Gauge;
  private readonly messageErrorCounter: Counter;

  constructor() {
    this.registry = new Registry();

    // Logger metrics
    this.logCounter = new Counter({
      name: 'logger_messages_total',
      help: 'Total number of log messages by level',
      labelNames: ['level'],
      registers: [this.registry],
    });

    this.logDurationHistogram = new Histogram({
      name: 'logger_operation_duration_seconds',
      help: 'Duration of logging operations',
      labelNames: ['operation'],
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.errorCounter = new Counter({
      name: 'logger_errors_total',
      help: 'Total number of error logs',
      registers: [this.registry],
    });

    // LLM metrics
    this.llmRequestCounter = new Counter({
      name: 'llm_requests_total',
      help: 'Total number of LLM API requests',
      labelNames: ['provider', 'model'],
      registers: [this.registry],
    });

    this.llmDurationHistogram = new Histogram({
      name: 'llm_request_duration_seconds',
      help: 'Duration of LLM API requests',
      labelNames: ['provider', 'model'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry],
    });

    this.llmErrorCounter = new Counter({
      name: 'llm_errors_total',
      help: 'Total number of LLM API errors',
      labelNames: ['provider', 'model', 'error_type'],
      registers: [this.registry],
    });

    this.llmTokenCounter = new Counter({
      name: 'llm_tokens_total',
      help: 'Total number of tokens used',
      labelNames: ['provider', 'model', 'type'],
      registers: [this.registry],
    });

    // Messaging metrics
    this.messageEmitCounter = new Counter({
      name: 'messaging_emits_total',
      help: 'Total number of emitted messages',
      labelNames: ['pattern'],
      registers: [this.registry],
    });

    this.messageSendCounter = new Counter({
      name: 'messaging_sends_total',
      help: 'Total number of sent messages',
      labelNames: ['pattern'],
      registers: [this.registry],
    });

    this.messageDurationHistogram = new Histogram({
      name: 'messaging_operation_duration_seconds',
      help: 'Duration of messaging operations',
      labelNames: ['operation', 'pattern'],
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.connectionGauge = new Gauge({
      name: 'messaging_connection_status',
      help: 'Current connection status (1 for connected, 0 for disconnected)',
      registers: [this.registry],
    });

    this.messageErrorCounter = new Counter({
      name: 'messaging_errors_total',
      help: 'Total number of messaging errors',
      labelNames: ['operation', 'error_type'],
      registers: [this.registry],
    });
  }

  async onModuleInit() {
    // Enable the default metrics (process, nodejs)
    this.registry.setDefaultLabels({
      app: 'doctor-ai',
    });
  }

  // Logger metrics methods
  incrementLogCount(level: string): void {
    this.logCounter.inc({ level });
  }

  observeLogDuration(operation: string, duration: number): void {
    this.logDurationHistogram.observe({ operation }, duration);
  }

  incrementErrorCount(): void {
    this.errorCounter.inc();
  }

  // LLM metrics methods
  incrementLLMRequest(provider: string, model: string): void {
    this.llmRequestCounter.inc({ provider, model });
  }

  observeLLMDuration(provider: string, model: string, duration: number): void {
    this.llmDurationHistogram.observe({ provider, model }, duration);
  }

  incrementLLMError(provider: string, model: string, errorType: string): void {
    this.llmErrorCounter.inc({ provider, model, error_type: errorType });
  }

  incrementLLMTokens(provider: string, model: string, type: 'prompt' | 'completion', count: number): void {
    this.llmTokenCounter.inc({ provider, model, type }, count);
  }

  // Messaging metrics methods
  incrementMessageEmit(pattern: string): void {
    this.messageEmitCounter.inc({ pattern });
  }

  incrementMessageSend(pattern: string): void {
    this.messageSendCounter.inc({ pattern });
  }

  observeMessageDuration(operation: string, pattern: string, duration: number): void {
    this.messageDurationHistogram.observe({ operation, pattern }, duration);
  }

  setConnectionStatus(isConnected: boolean): void {
    this.connectionGauge.set(isConnected ? 1 : 0);
  }

  incrementMessageError(operation: string, errorType: string): void {
    this.messageErrorCounter.inc({ operation, error_type: errorType });
  }

  // Get metrics for Prometheus scraping
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
} 