import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TreatmentController } from '../../src/controllers/treatment.controller';
import { TreatmentService } from '../../src/services/treatment.service';
import { RabbitMQService } from '../../src/rabbitmq/rabbitmq.service';
import { TreatmentType, TreatmentPriority, TreatmentStatus } from '../../src/interfaces/treatment.interface';
import configuration from '../../src/config/configuration';

describe('Treatment Service Integration', () => {
  let app: INestApplication;
  let treatmentService: TreatmentService;
  let rabbitMQService: RabbitMQService;

  const mockRabbitMQService = {
    publishTreatmentEvent: jest.fn(),
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
      const treatmentPlan = await treatmentService.createTreatment({
        patientId: '123',
        type: TreatmentType.MEDICATION,
        description: 'Test Treatment',
        priority: TreatmentPriority.HIGH,
        medications: [{
          name: 'Test Med',
          dosage: '10mg',
          frequency: 'Daily',
          duration: 7,
          instructions: ['Take with food'],
        }],
        instructions: ['Follow medication schedule'],
        duration: 7,
        frequency: 'Daily',
        startDate: new Date().toISOString(),
      });

      expect(treatmentPlan).toMatchObject({
        patientId: '123',
        type: TreatmentType.MEDICATION,
        status: TreatmentStatus.PENDING,
      });
      expect(mockRabbitMQService.publishTreatmentEvent).toHaveBeenCalledWith(
        'treatment.created',
        expect.objectContaining({
          treatment: expect.objectContaining({
            id: expect.any(String),
            patientId: '123',
          }),
        }),
      );

      // Update treatment progress
      const progress = await treatmentService.updateTreatmentProgress(treatmentPlan.id, {
        notes: 'Progress update',
        observations: ['Improved condition'],
        status: TreatmentStatus.IN_PROGRESS,
        nextCheckupDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(progress).toMatchObject({
        treatmentPlanId: treatmentPlan.id,
        notes: 'Progress update',
        observations: ['Improved condition'],
        status: TreatmentStatus.IN_PROGRESS,
      });
      expect(mockRabbitMQService.publishTreatmentEvent).toHaveBeenCalledWith(
        'treatment.progress.updated',
        expect.objectContaining({
          treatmentId: treatmentPlan.id,
          progress: expect.any(Object),
        }),
      );
    });
  });

  describe('Emergency Assessment Flow', () => {
    it('should handle emergency assessment and generate treatment', async () => {
      const emergencyId = '123';
      const assessment = {
        severity: TreatmentPriority.HIGH,
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
              name: expect.any(String),
              dosage: expect.any(String),
              frequency: expect.any(String),
              duration: expect.any(Number),
              instructions: expect.any(Array),
            }),
          ]),
        }),
      );
    });

    it('should handle different emergency conditions', async () => {
      const emergencyId = '124';
      const assessment = {
        severity: TreatmentPriority.HIGH,
        condition: 'ASTHMA_ATTACK',
      };

      await treatmentService.handleEmergencyAssessment(emergencyId, assessment);

      expect(mockRabbitMQService.publishEmergencyTreatment).toHaveBeenCalledWith(
        'emergency.treatment',
        expect.objectContaining({
          emergencyId,
          medications: expect.arrayContaining([
            expect.objectContaining({
              name: expect.any(String),
              dosage: expect.any(String),
              frequency: expect.any(String),
              duration: expect.any(Number),
              instructions: expect.any(Array),
            }),
          ]),
        }),
      );
    });
  });
}); 