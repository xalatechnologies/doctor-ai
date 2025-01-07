import { Controller, Get } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @ApiOperation({ summary: 'Get Prometheus metrics' })
  @Get()
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
} 