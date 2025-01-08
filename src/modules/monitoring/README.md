# Monitoring Module

## Overview

The Monitoring module provides comprehensive system monitoring, metrics collection, alerting, and visualization capabilities for the Doctor AI platform. It ensures system health, performance optimization, and proactive issue detection.

## Features

### 1. System Monitoring
- Real-time service health checks
- Resource utilization tracking
- Performance metrics collection
- Error rate monitoring
- Dependency status tracking

### 2. Metrics Collection
- Custom metrics aggregation
- Time-series data storage
- Statistical analysis
- Trend detection
- Capacity planning

### 3. Alerting System
- Configurable alert thresholds
- Multi-channel notifications
- Alert correlation
- Incident management
- Escalation policies

## Architecture

### Component Diagram
```plaintext
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  Metric Collector│─────▶│   Aggregator     │─────▶│  Time Series DB  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
                                                            │
                                                            ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  Alert Manager   │◀─────│  Rule Evaluator  │◀─────│   Query Engine   │
└──────────────────┘      └──────────────────┘      └──────────────────┘
        │                                                    │
        ▼                                                    ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│ Notification Hub │─────▶│ Incident Manager │◀─────│   Visualizer     │
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

## API Reference

### Metrics Collection

\`\`\`typescript
POST /monitoring/metrics

// Request
interface MetricInput {
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp?: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  metadata?: {
    description?: string;
    unit?: string;
    interval?: number;
  };
}

// Response
interface MetricResponse {
  id: string;
  status: 'success' | 'error';
  timestamp: string;
  metadata: {
    stored: boolean;
    aggregated: boolean;
    alerts: number;
  };
}
\`\`\`

### Alert Configuration

\`\`\`typescript
POST /monitoring/alerts/configure

// Request
interface AlertConfig {
  name: string;
  description: string;
  metric: string;
  condition: {
    operator: 'gt' | 'lt' | 'eq' | 'ne' | 'ge' | 'le';
    threshold: number;
    duration: string;
  };
  labels: Record<string, string>;
  severity: 'critical' | 'error' | 'warning' | 'info';
  notifications: {
    channels: string[];
    message: string;
    throttle?: string;
  };
  metadata?: Record<string, any>;
}

// Response
interface AlertConfigResponse {
  id: string;
  status: 'active' | 'inactive';
  created: string;
  nextEvaluation: string;
}
\`\`\`

## Configuration

### Environment Variables
\`\`\`bash
# Service Configuration
MONITORING_PORT=3004
NODE_ENV=development

# Metrics Configuration
METRICS_RETENTION_DAYS=30
METRICS_SCRAPE_INTERVAL=15
METRICS_CHUNK_SIZE=2000

# Alert Configuration
ALERT_CHECK_INTERVAL=60
ALERT_THROTTLE_DURATION=300
MAX_ALERTS_PER_MINUTE=100

# Storage Configuration
PROMETHEUS_URL=http://prometheus:9090
GRAFANA_URL=http://grafana:3000
ELASTICSEARCH_URL=http://elasticsearch:9200

# Notification Configuration
SLACK_WEBHOOK_URL=your_slack_webhook
EMAIL_API_KEY=your_email_api_key
PAGERDUTY_API_KEY=your_pagerduty_key
\`\`\`

## Implementation

### Metric Collection
\`\`\`typescript
interface MetricCollector {
  collect(metric: MetricInput): Promise<void>;
  aggregate(metrics: MetricInput[]): Promise<AggregatedMetrics>;
  store(metrics: AggregatedMetrics): Promise<void>;
}

class PrometheusCollector implements MetricCollector {
  private readonly client: PrometheusClient;
  private readonly aggregator: MetricAggregator;
  
  async collect(metric: MetricInput): Promise<void> {
    // Validate metric
    this.validateMetric(metric);
    
    // Transform to Prometheus format
    const prometheusMetric = this.transform(metric);
    
    // Store metric
    await this.client.store(prometheusMetric);
  }
  
  async aggregate(metrics: MetricInput[]): Promise<AggregatedMetrics> {
    return this.aggregator.aggregate(metrics);
  }
}
\`\`\`

## Monitoring Dashboards

### System Overview
- Service health status
- Resource utilization
- Error rates
- Response times
- Request volume

### Performance Metrics
- API latency
- Database performance
- Cache hit rates
- Queue lengths
- Processing times

### Business Metrics
- Active users
- Analysis requests
- Emergency cases
- Report generations
- Success rates

## Alert Rules

### System Alerts

| Alert | Condition | Severity | Response |
|-------|-----------|----------|----------|
| High CPU | >80% for 5m | Warning | Auto-scale |
| High Memory | >85% for 5m | Warning | Auto-scale |
| Service Down | Health check fails | Critical | Page SRE |
| High Error Rate | >5% for 2m | Error | Page Dev |

### Business Alerts

| Alert | Condition | Severity | Response |
|-------|-----------|----------|----------|
| Emergency Queue | >10 items | Critical | Page Medical |
| Analysis Latency | >2s for 5m | Warning | Investigate |
| LLM Errors | >1% for 1m | Error | Switch Provider |
| API Errors | >2% for 5m | Warning | Page Dev |

## Performance Optimization

### Metric Storage
- Efficient time-series storage
- Data downsampling
- Retention policies
- Query optimization
- Caching strategies

### Alert Processing
- Parallel rule evaluation
- Alert deduplication
- Notification batching
- Rate limiting
- Priority queuing

## Security

### Data Protection
- Metric encryption
- Access control
- Audit logging
- Data retention
- Secure transport

### Access Control
- Role-based access
- API authentication
- Dashboard permissions
- Alert management
- Audit trails

## Support

- Documentation: https://docs.doctor-ai.dev/monitoring
- Dashboard: https://grafana.doctor-ai.dev
- Alerts: https://alerts.doctor-ai.dev
- Support: monitoring-support@doctor-ai.dev 