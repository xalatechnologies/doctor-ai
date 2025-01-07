import { Injectable } from '@nestjs/common';
import { LLMProvider } from './llm-orchestration.service';

@Injectable()
export class MetricsService {
  async logError(context: string, error: Error): Promise<void> {
    console.error(`Error in ${context}:`, error);
  }

  async logLatency(operation: string, latency: number, success: boolean): Promise<void> {
    console.log(`Latency for ${operation}: ${latency}ms (${success ? 'success' : 'failure'})`);
  }

  async logProviderFailure(provider: LLMProvider): Promise<void> {
    console.error(`Provider ${provider} failed`);
  }

  getProviderMetrics(provider: LLMProvider): { successRate: number } | null {
    // Implement provider metrics tracking
    return { successRate: 0.8 };
  }
} 