import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { RabbitMQService } from './rabbitmq.service';

describe('RabbitMQService', () => {
  let service: RabbitMQService;
  let configService: ConfigService;
  let clientProxy: ClientProxy;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'RABBITMQ_URL':
          return 'amqp://test:5672';
        case 'RABBITMQ_QUEUE':
          return 'test_queue';
        default:
          return undefined;
      }
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitMQService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RabbitMQService>(RabbitMQService);
    configService = module.get<ConfigService>(ConfigService);
    clientProxy = service.getClient();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('emit', () => {
    it('should successfully emit an event', async () => {
      const pattern = 'test-event';
      const data = { message: 'test' };
      const emitSpy = jest.spyOn(clientProxy, 'emit').mockImplementation(() => ({
        toPromise: jest.fn().mockResolvedValue(undefined),
      } as any));

      await service.emit(pattern, data);

      expect(emitSpy).toHaveBeenCalledWith(pattern, data);
    });

    it('should throw error when emit fails', async () => {
      const pattern = 'test-event';
      const data = { message: 'test' };
      jest.spyOn(clientProxy, 'emit').mockImplementation(() => ({
        toPromise: jest.fn().mockRejectedValue(new Error('Emit failed')),
      } as any));

      await expect(service.emit(pattern, data)).rejects.toThrow('Emit failed');
    });
  });

  describe('send', () => {
    it('should successfully send a message and receive response', async () => {
      const pattern = 'test-message';
      const data = { message: 'test' };
      const response = { result: 'success' };
      const sendSpy = jest.spyOn(clientProxy, 'send').mockImplementation(() => ({
        toPromise: jest.fn().mockResolvedValue(response),
      } as any));

      const result = await service.send(pattern, data);

      expect(sendSpy).toHaveBeenCalledWith(pattern, data);
      expect(result).toEqual(response);
    });

    it('should throw error when send fails', async () => {
      const pattern = 'test-message';
      const data = { message: 'test' };
      jest.spyOn(clientProxy, 'send').mockImplementation(() => ({
        toPromise: jest.fn().mockRejectedValue(new Error('Send failed')),
      } as any));

      await expect(service.send(pattern, data)).rejects.toThrow('Send failed');
    });

    it('should throw error when no response received', async () => {
      const pattern = 'test-message';
      const data = { message: 'test' };
      jest.spyOn(clientProxy, 'send').mockImplementation(() => ({
        toPromise: jest.fn().mockResolvedValue(null),
      } as any));

      await expect(service.send(pattern, data)).rejects.toThrow('No response received');
    });
  });
}); 