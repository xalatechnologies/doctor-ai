import { Test, TestingModule } from '@nestjs/testing';
import { TreatmentService } from './treatment.service';
import { RabbitMQService } from '@rabbitmq/rabbitmq.service';
import { TreatmentType, TreatmentPriority, TreatmentStatus } from '@interfaces/treatment.interface';
import { MedicationDto } from '@dto/medication.dto';

describe('TreatmentService', () => {
  let service: TreatmentService;
  let rabbitMQService: RabbitMQService;

  const mockMedication: MedicationDto = {
    name: 'Amoxicillin',
    dosage: '500mg',
    frequency: 'Three times daily',
    duration: 7,
    instructions: ['Take with food'],
    sideEffects: ['Nausea', 'Diarrhea'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreatmentService,
        {
          provide: RabbitMQService,
          useValue: {
            publishTreatmentEvent: jest.fn().mockResolvedValue(undefined),
            publishEmergencyTreatment: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<TreatmentService>(TreatmentService);
    rabbitMQService = module.get<RabbitMQService>(RabbitMQService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTreatment', () => {
    it('should create a treatment plan', async () => {
      const createTreatmentDto = {
        patientId: 'PAT-123',
        type: TreatmentType.MEDICATION,
        description: 'Antibiotic treatment',
        priority: TreatmentPriority.HIGH,
        medications: [mockMedication],
        instructions: ['Complete full course'],
        duration: 7,
        frequency: 'Daily',
        startDate: new Date().toISOString(),
      };

      const result = await service.createTreatment(createTreatmentDto);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.patientId).toBe(createTreatmentDto.patientId);
      expect(result.type).toBe(createTreatmentDto.type);
      expect(result.status).toBe(TreatmentStatus.PENDING);
      expect(rabbitMQService.publishTreatmentEvent).toHaveBeenCalled();
    });
  });

  describe('updateTreatmentProgress', () => {
    it('should update treatment progress', async () => {
      // First create a treatment
      const treatment = await service.createTreatment({
        patientId: 'PAT-123',
        type: TreatmentType.MEDICATION,
        description: 'Test treatment',
        priority: TreatmentPriority.HIGH,
        medications: [mockMedication],
        instructions: ['Test instructions'],
        duration: 7,
        frequency: 'Daily',
        startDate: new Date().toISOString(),
      });

      const updateProgressDto = {
        status: TreatmentStatus.IN_PROGRESS,
        notes: 'Test progress update',
        observations: ['Test observation'],
        complications: [],
        adjustments: [],
        nextCheckupDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const result = await service.updateTreatmentProgress(treatment.id, updateProgressDto);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.treatmentPlanId).toBe(treatment.id);
      expect(result.status).toBe(updateProgressDto.status);
      expect(rabbitMQService.publishTreatmentEvent).toHaveBeenCalled();
    });

    it('should throw error for non-existent treatment', async () => {
      const updateProgressDto = {
        status: TreatmentStatus.IN_PROGRESS,
        notes: 'Test progress update',
        nextCheckupDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await expect(
        service.updateTreatmentProgress('non-existent-id', updateProgressDto)
      ).rejects.toThrow('Treatment with ID non-existent-id not found');
    });
  });
}); 