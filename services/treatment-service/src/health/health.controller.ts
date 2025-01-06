import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthCheckResult } from '@nestjs/terminus';
import { MessagePattern } from '@nestjs/microservices';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthCheckService) {}

  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([]);
  }

  @MessagePattern('treatment.health')
  async checkHealth(): Promise<{ status: string }> {
    try {
      await this.health.check([]);
      return { status: 'ok' };
    } catch (error) {
      return { status: 'error' };
    }
  }
} 