import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { MetricsService } from '../services/metrics.service';
import { ConfigService } from '@nestjs/config';
import { REDIS_CLIENT } from '../constants';

describe('HealthController', () => {
  let controller: HealthController;
  let metricsService: MetricsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: MetricsService,
          useValue: {
            getAggregateMetrics: jest.fn().mockReturnValue({
              totalRequests: 100,
              successRate: 0.95
            }),
            getPrometheusMetrics: jest.fn()
          }
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock-value')
          }
        },
        {
          provide: REDIS_CLIENT,
          useValue: {
            ping: jest.fn().mockResolvedValue('PONG')
          }
        }
      ]
    }).compile();

    controller = module.get(HealthController);
    metricsService = module.get(MetricsService);
  });

  describe('checkHealth', () => {
    it('should return health status', async () => {
      const result = await controller.checkHealth();
      expect(result.status).toBe('ok');
      expect(result.services.api.status).toBe('healthy');
    });
  });

  describe('getMetrics', () => {
    it('should return prometheus metrics', async () => {
      await controller.getMetrics();
      expect(metricsService.getPrometheusMetrics).toHaveBeenCalled();
    });
  });

  describe('getReadiness', () => {
    it('should check all dependencies', async () => {
      const result = await controller.getReadiness();
      expect(result.status).toBe('ready');
      expect(result.dependencies.redis).toBe('healthy');
      expect(result.dependencies.database).toBe('healthy');
    });

    it('should handle redis failure', async () => {
      jest.spyOn(controller['redis'], 'ping').mockRejectedValueOnce(new Error());
      const result = await controller.getReadiness();
      expect(result.dependencies.redis).toBe('unhealthy');
    });
  });

  describe('getLiveness', () => {
    it('should return uptime and timestamp', async () => {
      const result = await controller.getLiveness();
      expect(result.status).toBe('alive');
      expect(result.uptime).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });
  });
}); 