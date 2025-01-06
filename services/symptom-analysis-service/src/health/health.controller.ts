import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthCheckResult } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
  ) {}

  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return {
      status: 'ok',
      info: {
        api: {
          status: 'up',
        },
      },
      error: undefined,
      details: {
        api: {
          status: 'up',
        },
      },
    };
  }
} 