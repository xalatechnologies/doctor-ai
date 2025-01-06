import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { RabbitMQService } from '@rabbitmq/rabbitmq.service';
import { TreatmentStatus, TreatmentType, TreatmentPriority } from '@interfaces/treatment.interface';
import { TreatmentPublishingException } from '@exceptions/treatment.exception';

jest.mock('@nestjs/microservices', () => ({
  ClientProxy: jest.fn(),
  ClientProxyFactory: {
    create: jest.fn().mockReturnValue({
      connect: jest.fn(),
      close: jest.fn(),
      emit: jest.fn(),
    }),
  },
  Transport: { RMQ: 'rmq' },
}));

describe('RabbitMQService', () => {
  let service: RabbitMQService;
  let client: ClientProxy;

  const mockClient = {
    connect: jest.fn(),
    close: jest.fn(),
    emit: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [RabbitMQService],
    }).compile();

    service = module.get<RabbitMQService>(RabbitMQService);
    // @ts-ignore - we know this exists because we mocked it
    client = service['client'];
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should connect to RabbitMQ on init', async () => {
      mockClient.connect.mockResolvedValueOnce(undefined);
      // @ts-ignore - we know this exists because we mocked it
      service['client'] = mockClient;
      await service.onModuleInit();
      expect(mockClient.connect).toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      mockClient.connect.mockRejectedValueOnce(new Error('Connection failed'));
      // @ts-ignore - we know this exists because we mocked it
      service['client'] = mockClient;
      await expect(service.onModuleInit()).rejects.toThrow('Connection failed');
    });

    it('should close connection on destroy', async () => {
      // @ts-ignore - we know this exists because we mocked it
      service['client'] = mockClient;
      await service.onModuleDestroy();
      expect(mockClient.close).toHaveBeenCalled();
    });
  });

  describe('Event Publishing', () => {
    const treatmentData = {
      treatment: {
        id: 'TRT-123',
        patientId: 'PAT-123',
        type: TreatmentType.MEDICATION,
        description: 'Test treatment',
        priority: TreatmentPriority.HIGH,
        medications: ['Test medication'],
        instructions: ['Test instruction'],
        precautions: [],
        contraindications: [],
        duration: 7,
        frequency: 'Daily',
        status: TreatmentStatus.PENDING,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      originalData: {
        patientId: 'PAT-123',
        type: TreatmentType.MEDICATION,
      },
    };

    beforeEach(() => {
      // @ts-ignore - we know this exists because we mocked it
      service['client'] = mockClient;
    });

    it('should publish treatment event successfully', async () => {
      const pattern = 'treatment.created';
      mockClient.emit.mockReturnValueOnce({ toPromise: () => Promise.resolve() });

      await service.publishTreatmentEvent(pattern, treatmentData);
      expect(mockClient.emit).toHaveBeenCalledWith(pattern, treatmentData);
    });

    it('should handle publishing errors', async () => {
      const pattern = 'treatment.created';
      mockClient.emit.mockReturnValueOnce({ toPromise: () => Promise.reject(new Error('Publish failed')) });

      await expect(service.publishTreatmentEvent(pattern, treatmentData))
        .rejects.toThrow(TreatmentPublishingException);
    });
  });
}); 