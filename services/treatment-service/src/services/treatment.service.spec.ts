import { Test, TestingModule } from '@nestjs/testing';
import { TreatmentService } from '@services/treatment.service';
import { RabbitMQService } from '@rabbitmq/rabbitmq.service';
import { TreatmentStatus, TreatmentType, TreatmentPriority } from '@interfaces/treatment.interface';
import { CreateTreatmentDto } from '@dto/create-treatment.dto';
import { UpdateTreatmentProgressDto } from '@dto/update-treatment-progress.dto';
import { TreatmentNotFoundException, InvalidTreatmentDataException } from '@exceptions/treatment.exception';

describe('TreatmentService', () => {
  let service: TreatmentService;
  let rabbitMQService: RabbitMQService;

  const mockRabbitMQService = {
    publishTreatmentEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreatmentService,
        {
          provide: RabbitMQService,
          useValue: mockRabbitMQService,
        },
      ],
    }).compile();

    service = module.get<TreatmentService>(TreatmentService);
    rabbitMQService = module.get<RabbitMQService>(RabbitMQService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Setup', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have required methods', () => {
      expect(service.createTreatment).toBeDefined();
      expect(typeof service.createTreatment).toBe('function');
      expect(service.updateTreatmentProgress).toBeDefined();
      expect(typeof service.updateTreatmentProgress).toBe('function');
    });
  });

  describe('Treatment Creation', () => {
    const validTreatmentData: CreateTreatmentDto = {
      patientId: 'PAT-123',
      type: TreatmentType.MEDICATION,
      description: 'Antibiotic treatment for infection',
      priority: TreatmentPriority.HIGH,
      medications: ['Amoxicillin 500mg'],
      instructions: ['Take with food twice daily'],
      precautions: ['Avoid alcohol'],
      contraindications: ['Penicillin allergy'],
      duration: 7,
      frequency: 'Twice daily',
      startDate: new Date().toISOString(),
    };

    it('should create a treatment plan successfully', async () => {
      const result = await service.createTreatment(validTreatmentData);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.patientId).toBe(validTreatmentData.patientId);
      expect(result.type).toBe(validTreatmentData.type);
      expect(result.status).toBe(TreatmentStatus.PENDING);
      expect(rabbitMQService.publishTreatmentEvent).toHaveBeenCalledWith(
        'treatment.created',
        expect.objectContaining({
          treatment: result,
          originalData: validTreatmentData,
        }),
      );
    });

    it('should throw InvalidTreatmentDataException for missing required data', async () => {
      const invalidData = { ...validTreatmentData, patientId: '', instructions: [] };
      await expect(service.createTreatment(invalidData)).rejects.toThrow(InvalidTreatmentDataException);
    });

    it('should continue execution if publishing fails', async () => {
      mockRabbitMQService.publishTreatmentEvent.mockRejectedValueOnce(new Error('Publishing failed'));
      const result = await service.createTreatment(validTreatmentData);
      expect(result).toBeDefined();
      expect(result.status).toBe(TreatmentStatus.PENDING);
    });
  });

  describe('Treatment Progress Update', () => {
    const validProgressData: UpdateTreatmentProgressDto = {
      notes: 'Patient showing improvement',
      observations: ['Reduced pain', 'Better mobility'],
      complications: ['Mild nausea'],
      adjustments: ['Reduced dosage'],
      status: TreatmentStatus.IN_PROGRESS,
      nextCheckupDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    it('should update treatment progress successfully', async () => {
      const treatment = await service.createTreatment({
        patientId: 'PAT-123',
        type: TreatmentType.MEDICATION,
        description: 'Test treatment',
        priority: TreatmentPriority.MEDIUM,
        instructions: ['Test instruction'],
        duration: 7,
        frequency: 'Daily',
        startDate: new Date().toISOString(),
      });

      const result = await service.updateTreatmentProgress(treatment.id, validProgressData);
      
      expect(result).toBeDefined();
      expect(result.treatmentPlanId).toBe(treatment.id);
      expect(result.status).toBe(validProgressData.status);
      expect(rabbitMQService.publishTreatmentEvent).toHaveBeenCalledWith(
        'treatment.progress.updated',
        expect.objectContaining({
          treatmentId: treatment.id,
          progress: result,
        }),
      );
    });

    it('should throw TreatmentNotFoundException for non-existent treatment', async () => {
      await expect(
        service.updateTreatmentProgress('non-existent-id', validProgressData)
      ).rejects.toThrow(TreatmentNotFoundException);
    });

    it('should continue execution if publishing progress update fails', async () => {
      const treatment = await service.createTreatment({
        patientId: 'PAT-123',
        type: TreatmentType.MEDICATION,
        description: 'Test treatment',
        priority: TreatmentPriority.MEDIUM,
        instructions: ['Test instruction'],
        duration: 7,
        frequency: 'Daily',
        startDate: new Date().toISOString(),
      });

      mockRabbitMQService.publishTreatmentEvent.mockRejectedValueOnce(new Error('Publishing failed'));
      const result = await service.updateTreatmentProgress(treatment.id, validProgressData);
      expect(result).toBeDefined();
      expect(result.status).toBe(validProgressData.status);
    });
  });
}); 