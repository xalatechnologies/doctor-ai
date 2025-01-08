import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RateLimit {
  maxRequests: number;
  interval: number; // in milliseconds
  currentRequests: number;
  lastReset: number;
}

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private readonly limits: Map<string, RateLimit> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.initializeLimits();
  }

  private initializeLimits() {
    // OpenAI limits (3 requests per second)
    this.limits.set('openai', {
      maxRequests: this.configService.get<number>(
        'OPENAI_RATE_LIMIT_REQUESTS',
        3,
      ),
      interval: this.configService.get<number>(
        'OPENAI_RATE_LIMIT_INTERVAL',
        1000,
      ),
      currentRequests: 0,
      lastReset: Date.now(),
    });

    // Azure OpenAI limits (10 requests per second)
    this.limits.set('azure', {
      maxRequests: this.configService.get<number>(
        'AZURE_RATE_LIMIT_REQUESTS',
        10,
      ),
      interval: this.configService.get<number>(
        'AZURE_RATE_LIMIT_INTERVAL',
        1000,
      ),
      currentRequests: 0,
      lastReset: Date.now(),
    });

    // Anthropic limits (5 requests per second)
    this.limits.set('anthropic', {
      maxRequests: this.configService.get<number>(
        'ANTHROPIC_RATE_LIMIT_REQUESTS',
        5,
      ),
      interval: this.configService.get<number>(
        'ANTHROPIC_RATE_LIMIT_INTERVAL',
        1000,
      ),
      currentRequests: 0,
      lastReset: Date.now(),
    });

    // Google Med-PaLM 2 limits (10 requests per second)
    this.limits.set('palm', {
      maxRequests: this.configService.get<number>(
        'GOOGLE_PALM_RATE_LIMIT_REQUESTS',
        10,
      ),
      interval: this.configService.get<number>(
        'GOOGLE_PALM_RATE_LIMIT_INTERVAL',
        1000,
      ),
      currentRequests: 0,
      lastReset: Date.now(),
    });

    // Google Gemini limits (10 requests per second)
    this.limits.set('gemini', {
      maxRequests: this.configService.get<number>(
        'GOOGLE_GEMINI_RATE_LIMIT_REQUESTS',
        10,
      ),
      interval: this.configService.get<number>(
        'GOOGLE_GEMINI_RATE_LIMIT_INTERVAL',
        1000,
      ),
      currentRequests: 0,
      lastReset: Date.now(),
    });

    // Deepseek limits (5 requests per second)
    this.limits.set('deepseek', {
      maxRequests: this.configService.get<number>(
        'DEEPSEEK_RATE_LIMIT_REQUESTS',
        5,
      ),
      interval: this.configService.get<number>(
        'DEEPSEEK_RATE_LIMIT_INTERVAL',
        1000,
      ),
      currentRequests: 0,
      lastReset: Date.now(),
    });
  }

  async checkRateLimit(provider: string): Promise<boolean> {
    const limit = this.limits.get(provider);
    if (!limit) {
      this.logger.warn(`No rate limit configured for provider: ${provider}`);
      return true;
    }

    const now = Date.now();
    if (now - limit.lastReset >= limit.interval) {
      limit.currentRequests = 0;
      limit.lastReset = now;
    }

    if (limit.currentRequests >= limit.maxRequests) {
      const waitTime = limit.interval - (now - limit.lastReset);
      this.logger.warn(
        `Rate limit exceeded for ${provider}. Waiting ${waitTime}ms`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.checkRateLimit(provider);
    }

    limit.currentRequests++;
    return true;
  }

  async waitForCapacity(provider: string): Promise<void> {
    const limit = this.limits.get(provider);
    if (!limit) {
      return;
    }

    const now = Date.now();
    if (now - limit.lastReset >= limit.interval) {
      limit.currentRequests = 0;
      limit.lastReset = now;
      return;
    }

    if (limit.currentRequests >= limit.maxRequests) {
      const waitTime = limit.interval - (now - limit.lastReset);
      this.logger.debug(
        `Waiting ${waitTime}ms for ${provider} rate limit reset`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      await this.waitForCapacity(provider);
    }
  }

  getCurrentUsage(
    provider: string,
  ): { current: number; max: number; interval: number } | null {
    const limit = this.limits.get(provider);
    if (!limit) {
      return null;
    }

    return {
      current: limit.currentRequests,
      max: limit.maxRequests,
      interval: limit.interval,
    };
  }

  resetLimits(): void {
    for (const limit of this.limits.values()) {
      limit.currentRequests = 0;
      limit.lastReset = Date.now();
    }
  }
}
