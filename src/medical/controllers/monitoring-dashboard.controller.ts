import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth 
} from '@nestjs/swagger';
import { MetricsService } from '../services/metrics.service';
import { Alert, AlertingService } from '../services/alerting.service';
import { AlertConfig } from '../interfaces/alert-config.interface';
import { MetricsTimeframe } from '../services/metrics.service';
import { LLMProvider } from '../services/llm-orchestration.service';

@ApiTags('Monitoring Dashboard')
@Controller('dashboard')
@ApiBearerAuth()
export class MonitoringDashboardController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly alertingService: AlertingService
  ) {}

  @Get('performance')
  @ApiOperation({ summary: 'Get real-time performance metrics' })
  async getPerformanceMetrics(
    @Query('timeframe') timeframe: '1h' | '24h' | '7d' = '1h'
  ) {
    const metrics = await this.metricsService.getAllMetrics();
    const alerts = await this.alertingService.getCurrentAlerts();

    return {
      metrics: {
        providers: Object.fromEntries(Array.from(metrics) as [string, MetricsTimeframe][]),
        aggregate: this.metricsService.getAggregateMetrics()
      },
      alerts,
      status: this.calculateSystemStatus(metrics, alerts)
    };
  }

  @Get('alerts/history')
  @ApiOperation({ summary: 'Get alert history' })
  async getAlertHistory(
    @Query('from') fromStr: string,
    @Query('to') toStr: string
  ) {
    const from = new Date(fromStr);
    const to = new Date(toStr);
    return this.alertingService.getAlertHistory(from, to);
  }

  @Post('alerts/configure')
  @ApiOperation({ summary: 'Configure alert thresholds' })
  async configureAlerts(@Body() config: AlertConfig) {
    return this.alertingService.updateAlertConfig(config);
  }

  private calculateSystemStatus(metrics: Map<LLMProvider, MetricsTimeframe>, alerts: Alert[]) {
    const criticalAlerts = alerts.filter(a => a.severity === 'high' || a.severity === 'critical').length;
    const errorRates = Array.from(metrics.values())
      .map(m => m.total.failures / m.total.totalCalls);
    
    if (criticalAlerts > 0 || Math.max(...errorRates) > 0.1) {
      return 'degraded';
    }
    return 'healthy';
  }
} 