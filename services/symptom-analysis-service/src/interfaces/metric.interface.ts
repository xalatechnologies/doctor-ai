export interface Metric {
  operation: string;
  timestamp: Date;
  duration?: number;
  success: boolean;
  metadata?: Record<string, any>;
} 