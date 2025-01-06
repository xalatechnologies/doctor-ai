import { Test, TestingModule } from '@nestjs/testing';
import { TreatmentController } from './treatment.controller';
import { TreatmentService } from '@services/treatment.service';
import { CreateTreatmentDto } from '@dto/create-treatment.dto';
import { UpdateTreatmentProgressDto } from '@dto/update-treatment-progress.dto';
import { TreatmentType, TreatmentPriority, TreatmentStatus } from '@interfaces/treatment.interface';
import { MedicationDto } from '@dto/medication.dto';

describe('TreatmentController', () => {
  let controller: TreatmentController;
  let service: TreatmentService;

  const mockMedication: MedicationDto = {
    name: 'Amoxicillin',
    dosage: '500mg',
    frequency: 'Three times daily',
    duration: 7,
    instructions: ['Take with food'],
    sideEffects: ['Nausea', 'Diarrhea'],
  };

  const mockCreateTreatmentDto: CreateTreatmentDto = {
    patientId: 'PAT-123',
    type: TreatmentType.MEDICATION,
    description: 'Antibiotic treatment for infection',
    priority: TreatmentPriority.HIGH,
    medications: [mockMedication],
    instructions: ['Complete full course of antibiotics'],
    duration: 7,
    frequency: 'Daily',
    startDate: '2024-01-01',
  };

  const mockUpdateProgressDto: UpdateTreatmentProgressDto = {
    status: TreatmentStatus.IN_PROGRESS,
    notes: 'Patient showing improvement',
    observations: ['Reduced fever'],
    complications: [],
    adjustments: [],
    nextCheckupDate: '2024-01-08',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TreatmentController],
      providers: [
        {
          provide: TreatmentService,
          useValue: {
            createTreatment: jest.fn().mockResolvedValue({
              id: 'TRT-123',
              ...mockCreateTreatmentDto,
              status: TreatmentStatus.PENDING,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            }),
            updateTreatmentProgress: jest.fn().mockResolvedValue({
              id: 'PRG-123',
              treatmentPlanId: 'TRT-123',
              ...mockUpdateProgressDto,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<TreatmentController>(TreatmentController);
    service = module.get<TreatmentService>(TreatmentService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createTreatment', () => {
    it('should create a treatment plan', async () => {
      const result = await controller.createTreatment(mockCreateTreatmentDto);
      expect(result).toHaveProperty('id', 'TRT-123');
      expect(result.patientId).toBe(mockCreateTreatmentDto.patientId);
      expect(service.createTreatment).toHaveBeenCalledWith(mockCreateTreatmentDto);
    });
  });

  describe('updateTreatmentProgress', () => {
    it('should update treatment progress', async () => {
      const treatmentId = 'TRT-123';
      const result = await controller.updateTreatmentProgress(treatmentId, mockUpdateProgressDto);
      expect(result).toHaveProperty('id', 'PRG-123');
      expect(result.treatmentPlanId).toBe(treatmentId);
      expect(service.updateTreatmentProgress).toHaveBeenCalledWith(treatmentId, mockUpdateProgressDto);
    });
  });
}); 