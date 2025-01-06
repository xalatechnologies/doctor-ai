import { Test, TestingModule } from '@nestjs/testing';
import { RabbitMQService } from './rabbitmq.service';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, of } from 'rxjs';
import { TreatmentStatus } from '../interfaces/treatment.interface';

describe('RabbitMQService', () => {
  let service: RabbitMQService;
  let configService: ConfigService;
  let clientProxy: ClientProxy;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'rabbitmq.url': 'amqp://localhost:5672',
        'rabbitmq.queue': 'test-queue',
        'rabbitmq.prefetchCount': 1,
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const mockClientProxy = {
      connect: jest.fn().mockResolvedValue(undefined),
      emit: jest.fn().mockReturnValue(of(undefined)),
      send: jest.fn().mockReturnValue(of({})),
      close: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitMQService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: ClientProxy,
          useValue: mockClientProxy,
        },
      ],
    }).compile();

    service = module.get<RabbitMQService>(RabbitMQService);
    configService = module.get<ConfigService>(ConfigService);
    clientProxy = module.get<ClientProxy>(ClientProxy);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onApplicationBootstrap', () => {
    it('should connect to RabbitMQ successfully', async () => {
      await service.onApplicationBootstrap();
      expect(clientProxy.connect).toHaveBeenCalled();
    });

    it('should handle connection error', async () => {
      (clientProxy.connect as jest.Mock).mockRejectedValue(new Error('Connection failed'));
      await expect(service.onApplicationBootstrap()).rejects.toThrow('Connection failed');
    });
  });

  describe('publishTreatmentPlan', () => {
    it('should publish treatment plan successfully', async () => {
      const pattern = 'treatment.plan';
      const treatmentPlan = {
        id: '123',
        patientId: '456',
        diagnosis: 'Common cold',
        medications: [{
          name: 'Paracetamol',
          dosage: '500mg',
          route: 'Oral',
          frequency: 'Every 6 hours'
        }],
        followUpSchedule: [{
          date: new Date(),
          type: 'Check-up',
          notes: 'Follow up in 2 weeks',
          completed: false
        }],
        status: TreatmentStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await service.publishTreatmentPlan(pattern, treatmentPlan);
      expect(clientProxy.emit).toHaveBeenCalledWith(pattern, treatmentPlan);
    });

    it('should handle publish error', async () => {
      const pattern = 'treatment.plan';
      const treatmentPlan = {
        id: '123',
        patientId: '456',
        diagnosis: 'Common cold',
        medications: [{
          name: 'Paracetamol',
          dosage: '500mg',
          route: 'Oral',
          frequency: 'Every 6 hours'
        }],
        followUpSchedule: [{
          date: new Date(),
          type: 'Check-up',
          notes: 'Follow up in 2 weeks',
          completed: false
        }],
        status: TreatmentStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (clientProxy.emit as jest.Mock).mockReturnValue(
        new Promise((_, reject) => reject(new Error('Publish failed')))
      );

      await expect(service.publishTreatmentPlan(pattern, treatmentPlan)).rejects.toThrow('Publish failed');
    });
  });

  describe('sendRequest', () => {
    it('should send request successfully', async () => {
      const pattern = 'test.pattern';
      const data = { test: 'data' };
      const response = { result: 'success' };

      (clientProxy.send as jest.Mock).mockReturnValue(of(response));

      const result = await service.sendRequest(pattern, data);
      expect(clientProxy.send).toHaveBeenCalledWith(pattern, data);
      expect(result).toEqual(response);
    });

    it('should handle send error', async () => {
      const pattern = 'test.pattern';
      const data = { test: 'data' };

      (clientProxy.send as jest.Mock).mockReturnValue(
        new Promise((_, reject) => reject(new Error('Send failed')))
      );

      await expect(service.sendRequest(pattern, data)).rejects.toThrow('Send failed');
    });
  });

  describe('onApplicationShutdown', () => {
    it('should close RabbitMQ connection', async () => {
      await service.onApplicationShutdown();
      expect(clientProxy.close).toHaveBeenCalled();
    });
  });
}); 