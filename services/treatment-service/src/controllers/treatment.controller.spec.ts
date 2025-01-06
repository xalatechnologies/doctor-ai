import { Test, TestingModule } from '@nestjs/testing';
import { TreatmentController } from '@controllers/treatment.controller';
import { TreatmentService } from '@services/treatment.service';
import { CreateTreatmentDto } from '@dto/create-treatment.dto';
import { UpdateTreatmentProgressDto } from '@dto/update-treatment-progress.dto';
import { TreatmentType, TreatmentPriority, TreatmentStatus } from '@interfaces/treatment.interface';

describe('TreatmentController', () => {
  let controller: TreatmentController;
  let service: TreatmentService;

  const mockTreatmentService = {
    createTreatment: jest.fn(),
    updateTreatmentProgress: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TreatmentController],
      providers: [
        {
          provide: TreatmentService,
          useValue: mockTreatmentService,
        },
      ],
    }).compile();

    controller = module.get<TreatmentController>(TreatmentController);
    service = module.get<TreatmentService>(TreatmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Controller Setup', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have required methods', () => {
      expect(controller.createTreatment).toBeDefined();
      expect(typeof controller.createTreatment).toBe('function');
      expect(controller.updateTreatmentProgress).toBeDefined();
      expect(typeof controller.updateTreatmentProgress).toBe('function');
    });
  });

  describe('Treatment Creation', () => {
    const createDto: CreateTreatmentDto = {
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

    it('should create a treatment plan', async () => {
      const expectedResponse = {
        id: 'TRT-123',
        ...createDto,
        status: TreatmentStatus.PENDING,
        endDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockTreatmentService.createTreatment.mockResolvedValueOnce(expectedResponse);

      const result = await controller.createTreatment(createDto);
      expect(result).toEqual(expectedResponse);
      expect(service.createTreatment).toHaveBeenCalledWith(createDto);
    });

    it('should handle errors during treatment creation', async () => {
      const error = new Error('Failed to create treatment');
      mockTreatmentService.createTreatment.mockRejectedValueOnce(error);

      await expect(controller.createTreatment(createDto)).rejects.toThrow(error);
    });
  });

  describe('Treatment Progress Update', () => {
    const progressDto: UpdateTreatmentProgressDto = {
      notes: 'Patient showing improvement',
      observations: ['Reduced pain', 'Better mobility'],
      complications: ['Mild nausea'],
      adjustments: ['Reduced dosage'],
      status: TreatmentStatus.IN_PROGRESS,
      nextCheckupDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    it('should update treatment progress', async () => {
      const expectedResponse = {
        id: 'PRG-123',
        treatmentPlanId: 'TRT-123',
        date: new Date().toISOString(),
        ...progressDto,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockTreatmentService.updateTreatmentProgress.mockResolvedValueOnce(expectedResponse);

      const result = await controller.updateTreatmentProgress('TRT-123', progressDto);
      expect(result).toEqual(expectedResponse);
      expect(service.updateTreatmentProgress).toHaveBeenCalledWith('TRT-123', progressDto);
    });

    it('should handle errors during progress update', async () => {
      const error = new Error('Failed to update treatment progress');
      mockTreatmentService.updateTreatmentProgress.mockRejectedValueOnce(error);

      await expect(controller.updateTreatmentProgress('TRT-123', progressDto)).rejects.toThrow(error);
    });
  });
}); 