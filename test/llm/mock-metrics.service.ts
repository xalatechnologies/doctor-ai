import { Injectable } from '@nestjs/common';

@Injectable()
export class MockMetricsService {
  logError = jest.fn();
  logInfo = jest.fn();
  logWarning = jest.fn();
  logDebug = jest.fn();
  recordMetric = jest.fn();
  incrementCounter = jest.fn();
  recordLatency = jest.fn();
  recordTaskCompletion = jest.fn();
  recordProviderUsage = jest.fn();
  recordTokenUsage = jest.fn();
  recordCost = jest.fn();
  recordError = jest.fn();
  recordSuccess = jest.fn();
  recordFailure = jest.fn();
  recordRetry = jest.fn();
  recordTimeout = jest.fn();
  recordRateLimit = jest.fn();
  recordCacheHit = jest.fn();
  recordCacheMiss = jest.fn();
  recordModelMetrics = jest.fn();
  recordTaskMetrics = jest.fn();
  incrementProviderError = jest.fn();
} 