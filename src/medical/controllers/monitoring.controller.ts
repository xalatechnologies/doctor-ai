import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MetricsService } from '../services/metrics.service';

@ApiTags('Monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get LLM performance metrics' })
  @ApiResponse({
    status: 200,
    description: 'Returns performance metrics for all LLM providers'
  })
  getMetrics() {
    return {
      providers: Object.fromEntries(this.metricsService.getAllMetrics()),
      aggregate: this.metricsService.getAggregateMetrics()
    };
  }
} 