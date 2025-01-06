import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TreatmentController } from '@controllers/treatment.controller';
import { TreatmentService } from '@services/treatment.service';
import { RabbitMQService } from '@rabbitmq/rabbitmq.service';
import { TreatmentStatus } from '@interfaces/treatment.interface';
import configuration from '@config/configuration';

describe('Treatment Service Integration', () => {
  let app: INestApplication;
  let treatmentService: TreatmentService;
  let rabbitMQService: RabbitMQService;

  const mockRabbitMQService = {
    publishTreatmentPlan: jest.fn(),
    publishTreatmentAnalysis: jest.fn(),
    publishEmergencyTreatment: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [configuration],
          isGlobal: true,
        }),
      ],
      controllers: [TreatmentController],
      providers: [
        TreatmentService,
        {
          provide: RabbitMQService,
          useValue: mockRabbitMQService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    treatmentService = moduleFixture.get<TreatmentService>(TreatmentService);
    rabbitMQService = moduleFixture.get<RabbitMQService>(RabbitMQService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Treatment Plan Creation and Progress Update Flow', () => {
    it('should create a treatment plan and update progress', async () => {
      // Create treatment plan
      const treatmentPlan = await treatmentService.createTreatmentPlan({
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
      });

      expect(treatmentPlan).toMatchObject({
        patientId: '123',
        diagnosis: 'Test Diagnosis',
        status: TreatmentStatus.ACTIVE,
      });
      expect(mockRabbitMQService.publishTreatmentPlan).toHaveBeenCalledWith(
        'treatment.created',
        expect.objectContaining({
          id: expect.any(String),
          patientId: '123',
        }),
      );

      // Update treatment progress
      const progress = await treatmentService.updateTreatmentProgress(treatmentPlan.id, {
        symptoms: [
          {
            name: 'Fever',
            severity: 2,
            previousSeverity: 3,
          },
        ],
        medicationAdherence: [
          {
            medicationId: treatmentPlan.medications[0].name,
            adherenceRate: 0.9,
            missedDoses: 1,
          },
        ],
      });

      expect(progress).toMatchObject({
        treatmentPlanId: treatmentPlan.id,
        symptoms: expect.arrayContaining([
          expect.objectContaining({
            name: 'Fever',
            severity: 2,
          }),
        ]),
      });
      expect(mockRabbitMQService.publishTreatmentAnalysis).toHaveBeenCalled();
    });
  });

  describe('Emergency Assessment Flow', () => {
    it('should handle emergency assessment and generate treatment', async () => {
      const emergencyId = '123';
      const assessment = {
        severity: 'HIGH',
        condition: 'ALLERGIC_REACTION',
      };

      await treatmentService.handleEmergencyAssessment(emergencyId, assessment);

      expect(mockRabbitMQService.publishEmergencyTreatment).toHaveBeenCalledWith(
        'emergency.treatment',
        expect.objectContaining({
          emergencyId,
          recommendedActions: expect.any(Array),
          medications: expect.arrayContaining([
            expect.objectContaining({
              name: 'Epinephrine',
              route: 'IM',
            }),
          ]),
        }),
      );
    });

    it('should handle different emergency conditions', async () => {
      const emergencyId = '124';
      const assessment = {
        severity: 'HIGH',
        condition: 'ASTHMA_ATTACK',
      };

      await treatmentService.handleEmergencyAssessment(emergencyId, assessment);

      expect(mockRabbitMQService.publishEmergencyTreatment).toHaveBeenCalledWith(
        'emergency.treatment',
        expect.objectContaining({
          emergencyId,
          medications: expect.arrayContaining([
            expect.objectContaining({
              name: 'Albuterol',
              route: 'Nebulizer',
            }),
          ]),
        }),
      );
    });
  });
}); 