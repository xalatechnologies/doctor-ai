import { Test, TestingModule } from '@nestjs/testing';
import { RabbitMQService } from './rabbitmq.service';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from '../metrics/metrics.service';
import { ClientProxy } from '@nestjs/microservices';

describe('RabbitMQService', () => {
  let service: RabbitMQService;
  let configService: ConfigService;
  let metricsService: MetricsService;
  let client: ClientProxy;

  beforeEach(async () => {
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
          useValue: {
            recordLatency: jest.fn(),
            logError: jest.fn(),
            setConnectionStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RabbitMQService>(RabbitMQService);
    configService = module.get<ConfigService>(ConfigService);
    metricsService = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('connection management', () => {
    it('should initialize connection on module init', async () => {
      const connectSpy = jest
        .spyOn(service.getClient(), 'connect')
        .mockResolvedValue(undefined);
      await service.onModuleInit();
      expect(connectSpy).toHaveBeenCalled();
      expect(metricsService.setConnectionStatus).toHaveBeenCalledWith(true);
    });

    it('should clean up connection on module destroy', async () => {
      const closeSpy = jest
        .spyOn(service.getClient(), 'close')
        .mockResolvedValue(undefined);
      await service.onModuleDestroy();
      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('message handling', () => {
    it('should emit events', async () => {
      const pattern = 'test-event';
      const data = { message: 'test' };
      const emitSpy = jest
        .spyOn(service.getClient(), 'emit')
        .mockImplementation(
          () =>
            ({
              toPromise: jest.fn().mockResolvedValue(undefined),
            }) as any,
        );

      await service.emit(pattern, data);
      expect(emitSpy).toHaveBeenCalledWith(pattern, data);
    });

    it('should send messages and receive responses', async () => {
      const pattern = 'test-message';
      const data = { message: 'test' };
      const response = { result: 'success' };
      const sendSpy = jest
        .spyOn(service.getClient(), 'send')
        .mockImplementation(
          () =>
            ({
              toPromise: jest.fn().mockResolvedValue(response),
            }) as any,
        );

      const result = await service.send(pattern, data);
      expect(sendSpy).toHaveBeenCalledWith(pattern, data);
      expect(result).toEqual(response);
    });
  });

  describe('error handling', () => {
    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      jest.spyOn(service.getClient(), 'connect').mockRejectedValue(error);

      await expect(service.onModuleInit()).rejects.toThrow(error);
      expect(metricsService.setConnectionStatus).toHaveBeenCalledWith(false);
      expect(metricsService.logError).toHaveBeenCalled();
    });

    it('should handle emit errors', async () => {
      const error = new Error('Emit failed');
      jest.spyOn(service.getClient(), 'emit').mockImplementation(
        () =>
          ({
            toPromise: jest.fn().mockRejectedValue(error),
          }) as any,
      );

      await expect(service.emit('test-event', {})).rejects.toThrow(error);
      expect(metricsService.logError).toHaveBeenCalled();
    });
  });
});
