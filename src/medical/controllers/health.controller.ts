import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MetricsService } from '../services/metrics.service';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import { SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../constants';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private supabase: SupabaseClient;

  constructor(
    private metricsService: MetricsService,
    private configService: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis
  ) {
    this.supabase = new SupabaseClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_KEY')
    );
  }

  @Get()
  @ApiOperation({ summary: 'Check application health' })
  async checkHealth() {
    const metrics = this.metricsService.getAggregateMetrics();
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: 'healthy',
          metrics: {
            totalRequests: metrics.totalRequests,
            successRate: metrics.successRate
          }
        },
        redis: {
          status: await this.checkRedisHealth()
        }
      }
    };
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get Prometheus metrics' })
  async getMetrics() {
    return this.metricsService.getPrometheusMetrics();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  async getReadiness() {
    return {
      status: 'ready',
      dependencies: {
        redis: await this.checkRedisHealth(),
        database: await this.checkDatabaseHealth()
      }
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  async getLiveness() {
    return {
      status: 'alive',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  private async checkRedisHealth(): Promise<'healthy' | 'unhealthy'> {
    try {
      const ping = await this.redis.ping();
      return ping === 'PONG' ? 'healthy' : 'unhealthy';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return 'unhealthy';
    }
  }

  private async checkDatabaseHealth(): Promise<'healthy' | 'unhealthy'> {
    try {
      const { data, error } = await this.supabase
        .from('health_checks')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      return 'healthy';
    } catch (error) {
      console.error('Database health check failed:', error);
      return 'unhealthy';
    }
  }
} 