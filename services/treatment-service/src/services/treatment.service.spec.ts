import { Test, TestingModule } from '@nestjs/testing';
import { TreatmentService } from './treatment.service';
import { RabbitMQService } from '@rabbitmq/rabbitmq.service';
import { TreatmentStatus } from '@interfaces/treatment.interface';
import { CreateTreatmentPlanDto } from '@dto/create-treatment.dto';
import { UpdateTreatmentProgressDto } from '@dto/update-treatment.dto';

describe('TreatmentService', () => {
  let service: TreatmentService;
  let rabbitMQService: RabbitMQService;

  const mockRabbitMQService = {
    publishTreatmentPlan: jest.fn(),
    publishTreatmentAnalysis: jest.fn(),
    publishEmergencyTreatment: jest.fn(),
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

  it('should be defined', () => {
    expect(service).toBeDefined();
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

    it('should create a treatment plan and publish event', async () => {
      const result = await service.createTreatmentPlan(createDto);

      expect(result).toMatchObject({
        patientId: createDto.patientId,
        diagnosis: createDto.diagnosis,
        status: TreatmentStatus.ACTIVE,
      });
      expect(rabbitMQService.publishTreatmentPlan).toHaveBeenCalledWith(
        'treatment.created',
        expect.objectContaining({
          id: expect.any(String),
          patientId: createDto.patientId,
        }),
      );
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

    it('should throw error if treatment plan not found', async () => {
      await expect(
        service.updateTreatmentProgress('nonexistent', progressDto),
      ).rejects.toThrow('Treatment plan nonexistent not found');
    });

    it('should update progress and analyze treatment', async () => {
      // First create a treatment plan
      const plan = await service.createTreatmentPlan({
        patientId: '123',
        diagnosis: 'Test',
        medications: [],
        followUpSchedule: [],
      });

      const result = await service.updateTreatmentProgress(plan.id, progressDto);

      expect(result).toMatchObject({
        treatmentPlanId: plan.id,
        symptoms: progressDto.symptoms,
      });
      expect(rabbitMQService.publishTreatmentAnalysis).toHaveBeenCalled();
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

    it('should generate and publish emergency treatment', async () => {
      await service.handleEmergencyAssessment(
        emergencyData.emergencyId,
        emergencyData.assessment,
      );

      expect(rabbitMQService.publishEmergencyTreatment).toHaveBeenCalledWith(
        'emergency.treatment',
        expect.objectContaining({
          emergencyId: emergencyData.emergencyId,
          recommendedActions: expect.any(Array),
          medications: expect.any(Array),
        }),
      );
    });

    it('should include appropriate medications for allergic reaction', async () => {
      await service.handleEmergencyAssessment(
        emergencyData.emergencyId,
        emergencyData.assessment,
      );

      expect(rabbitMQService.publishEmergencyTreatment).toHaveBeenCalledWith(
        'emergency.treatment',
        expect.objectContaining({
          medications: expect.arrayContaining([
            expect.objectContaining({
              name: 'Epinephrine',
              route: 'IM',
            }),
          ]),
        }),
      );
    });
  });
}); 