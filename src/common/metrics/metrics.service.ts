import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly counters: Map<string, number> = new Map();

  constructor(private readonly configService: ConfigService) {}

  async incrementCounter(name: string, value = 1): Promise<void> {
    try {
      const currentValue = this.counters.get(name) || 0;
      this.counters.set(name, currentValue + value);
      this.logger.debug(`Incremented counter ${name} by ${value}`, {
        name,
        value,
        newValue: currentValue + value,
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to increment counter ${name}: ${error.message}`, {
          name,
          value,
          error,
        });
      } else {
        this.logger.error(`Failed to increment counter ${name}: Unknown error`, {
          name,
          value,
        });
      }
      throw error;
    }
  }

  async getCounter(name: string): Promise<number> {
    return this.counters.get(name) || 0;
  }

  async resetCounter(name: string): Promise<void> {
    this.counters.set(name, 0);
  }
}
