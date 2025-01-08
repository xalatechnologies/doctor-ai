import { Metric } from './metric.interface';

export interface IMetricsService {
  recordMetric(metric: Metric): Promise<void>;
} 