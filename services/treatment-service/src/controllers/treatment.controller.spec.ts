import { Test, TestingModule } from '@nestjs/testing';
import { TreatmentController } from './treatment.controller';
import { TreatmentService } from '@services/treatment.service';
import { CreateTreatmentPlanDto } from '@dto/create-treatment.dto';
import { UpdateTreatmentPlanDto, UpdateTreatmentProgressDto } from '@dto/update-treatment.dto';
import { TreatmentStatus } from '@interfaces/treatment.interface';

describe('TreatmentController', () => {
  let controller: TreatmentController;
  let service: TreatmentService;

  const mockTreatmentService = {
    createTreatmentPlan: jest.fn(),
    updateTreatmentPlan: jest.fn(),
    updateTreatmentProgress: jest.fn(),
    handleEmergencyAssessment: jest.fn(),
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

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createTreatmentPlan', () => {
    const createDto: CreateTreatmentPlanDto = {
      patientId: '123',
      diagnosis: 'Test Diagnosis',
      medications: [
        {
          name: 'Test Med',
          dosage: '10mg',
          route: 'Oral',
          frequency: 'Daily',
        },
      ],
      followUpSchedule: [
        {
          date: new Date(),
          type: 'Check-up',
          notes: 'Follow-up notes',
          completed: false,
        },
      ],
    };

    const mockResponse = {
      id: 'test-id',
      ...createDto,
      status: TreatmentStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      mockTreatmentService.createTreatmentPlan.mockResolvedValue(mockResponse);
    });

    it('should create treatment plan via HTTP', async () => {
      const result = await controller.createTreatmentPlanHttp(createDto);
      expect(result).toBe(mockResponse);
      expect(service.createTreatmentPlan).toHaveBeenCalledWith(createDto);
    });

    it('should create treatment plan via message pattern', async () => {
      const result = await controller.createTreatmentPlan(createDto);
      expect(result).toBe(mockResponse);
      expect(service.createTreatmentPlan).toHaveBeenCalledWith(createDto);
    });
  });

  describe('updateTreatmentPlan', () => {
    const updateDto: UpdateTreatmentPlanDto = {
      diagnosis: 'Updated Diagnosis',
      status: TreatmentStatus.COMPLETED,
    };

    const mockResponse = {
      id: 'test-id',
      patientId: '123',
      ...updateDto,
      medications: [],
      followUpSchedule: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      mockTreatmentService.updateTreatmentPlan.mockResolvedValue(mockResponse);
    });

    it('should update treatment plan via HTTP', async () => {
      const result = await controller.updateTreatmentPlanHttp('test-id', updateDto);
      expect(result).toBe(mockResponse);
      expect(service.updateTreatmentPlan).toHaveBeenCalledWith('test-id', updateDto);
    });

    it('should update treatment plan via message pattern', async () => {
      const result = await controller.updateTreatmentPlan({ id: 'test-id', dto: updateDto });
      expect(result).toBe(mockResponse);
      expect(service.updateTreatmentPlan).toHaveBeenCalledWith('test-id', updateDto);
    });
  });

  describe('updateTreatmentProgress', () => {
    const progressDto: UpdateTreatmentProgressDto = {
      symptoms: [
        {
          name: 'Fever',
          severity: 2,
          previousSeverity: 3,
        },
      ],
      medicationAdherence: [
        {
          medicationId: '123',
          adherenceRate: 0.9,
          missedDoses: 1,
        },
      ],
    };

    const mockResponse = {
      treatmentPlanId: 'test-id',
      ...progressDto,
      updatedAt: new Date(),
    };

    beforeEach(() => {
      mockTreatmentService.updateTreatmentProgress.mockResolvedValue(mockResponse);
    });

    it('should update treatment progress via HTTP', async () => {
      const result = await controller.updateTreatmentProgressHttp('test-id', progressDto);
      expect(result).toBe(mockResponse);
      expect(service.updateTreatmentProgress).toHaveBeenCalledWith('test-id', progressDto);
    });

    it('should update treatment progress via message pattern', async () => {
      const result = await controller.updateTreatmentProgress({ id: 'test-id', dto: progressDto });
      expect(result).toBe(mockResponse);
      expect(service.updateTreatmentProgress).toHaveBeenCalledWith('test-id', progressDto);
    });
  });

  describe('handleEmergencyAssessment', () => {
    const emergencyData = {
      emergencyId: '123',
      assessment: {
        severity: 'HIGH',
        condition: 'ALLERGIC_REACTION',
      },
    };

    beforeEach(() => {
      mockTreatmentService.handleEmergencyAssessment.mockResolvedValue(undefined);
    });

    it('should handle emergency assessment via message pattern', async () => {
      await controller.handleEmergencyAssessment(emergencyData);
      expect(service.handleEmergencyAssessment).toHaveBeenCalledWith(
        emergencyData.emergencyId,
        emergencyData.assessment,
      );
    });
  });
}); 