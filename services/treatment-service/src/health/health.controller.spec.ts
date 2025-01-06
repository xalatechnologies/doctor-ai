import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthCheckService, HealthCheckResult } from '@nestjs/terminus';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: HealthCheckService;

  const mockHealthCheckService = {
    check: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: mockHealthCheckService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get<HealthCheckService>(HealthCheckService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    const mockHealthCheckResult: HealthCheckResult = {
      status: 'ok',
      info: {},
      error: {},
      details: {},
    };

    beforeEach(() => {
      mockHealthCheckService.check.mockResolvedValue(mockHealthCheckResult);
    });

    it('should return health check result via HTTP', async () => {
      const result = await controller.check();
      expect(result).toBe(mockHealthCheckResult);
      expect(healthService.check).toHaveBeenCalledWith([]);
    });
  });

  describe('checkHealth', () => {
    beforeEach(() => {
      mockHealthCheckService.check.mockResolvedValue({
        status: 'ok',
        info: {},
        error: {},
        details: {},
      });
    });

    it('should return ok status when health check passes', async () => {
      const result = await controller.checkHealth();
      expect(result).toEqual({ status: 'ok' });
      expect(healthService.check).toHaveBeenCalledWith([]);
    });

    it('should return error status when health check fails', async () => {
      mockHealthCheckService.check.mockRejectedValue(new Error('Health check failed'));
      const result = await controller.checkHealth();
      expect(result).toEqual({ status: 'error' });
      expect(healthService.check).toHaveBeenCalledWith([]);
    });
  });
}); 