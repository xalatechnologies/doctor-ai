import { Test, TestingModule } from '@nestjs/testing';
import { RabbitMQService } from './rabbitmq.service';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from '../metrics/metrics.service';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, of, throwError } from 'rxjs';

describe('RabbitMQService', () => {
  let service: RabbitMQService;
  let configService: ConfigService;
  let metricsService: jest.Mocked<MetricsService>;
  let mockClientProxy: jest.Mocked<ClientProxy>;

  beforeEach(async () => {
    mockClientProxy = {
      connect: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      emit: jest.fn().mockReturnValue(of(undefined)),
      send: jest.fn().mockReturnValue(of(undefined)),
    } as any;

    const mockMetricsService = {
      recordLatency: jest.fn(),
      logError: jest.fn(),
      setConnectionStatus: jest.fn(),
      incrementProviderError: jest.fn(),
      recordTaskMetrics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitMQService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              switch (key) {
                case 'RABBITMQ_URL':
                  return 'amqp://localhost:5672';
                case 'RABBITMQ_QUEUE':
                  return 'test-queue';
                default:
                  return undefined;
              }
            }),
          },
        },
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
        {
          provide: ClientProxy,
          useValue: mockClientProxy,
        },
      ],
    }).compile();

    service = module.get<RabbitMQService>(RabbitMQService);
    configService = module.get<ConfigService>(ConfigService);
    metricsService = module.get(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('connection management', () => {
    it('should initialize connection on module init', async () => {
      await service.onModuleInit();
      expect(mockClientProxy.connect).toHaveBeenCalled();
      expect(metricsService.setConnectionStatus).toHaveBeenCalledWith(true);
    });

    it('should clean up connection on module destroy', async () => {
      await service.onModuleDestroy();
      expect(mockClientProxy.close).toHaveBeenCalled();
    });
  });

  describe('message handling', () => {
    it('should emit events', async () => {
      const pattern = 'test-event';
      const data = { message: 'test' };

      await service.emit(pattern, data);
      expect(mockClientProxy.emit).toHaveBeenCalledWith(pattern, data);
    });

    it('should send messages and receive responses', async () => {
      const pattern = 'test-message';
      const data = { message: 'test' };
      const response = { result: 'success' };
      mockClientProxy.send.mockReturnValue(of(response));

      const result = await service.send(pattern, data);
      expect(mockClientProxy.send).toHaveBeenCalledWith(pattern, data);
      expect(result).toEqual(response);
    });
  });

  describe('error handling', () => {
    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      mockClientProxy.connect.mockRejectedValue(error);

      await expect(service.onModuleInit()).rejects.toThrow(error);
      expect(metricsService.setConnectionStatus).toHaveBeenCalledWith(false);
      expect(metricsService.logError).toHaveBeenCalled();
    });

    it('should handle emit errors', async () => {
      const error = new Error('Emit failed');
      mockClientProxy.emit.mockReturnValue(throwError(() => error));

      await expect(service.emit('test-event', {})).rejects.toThrow('Failed to emit message: Emit failed');
      expect(metricsService.logError).toHaveBeenCalled();
    });
  });
});
