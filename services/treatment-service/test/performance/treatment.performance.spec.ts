import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TreatmentController } from '@controllers/treatment.controller';
import { TreatmentService } from '@services/treatment.service';
import { RabbitMQService } from '@rabbitmq/rabbitmq.service';
import configuration from '@config/configuration';

describe('Treatment Service Performance', () => {
  let app: INestApplication;
  let treatmentService: TreatmentService;

  const mockRabbitMQService = {
    publishTreatmentPlan: jest.fn(),
    publishTreatmentAnalysis: jest.fn(),
    publishEmergencyTreatment: jest.fn(),
  };

  const createTreatmentPlan = async () => {
    return treatmentService.createTreatmentPlan({
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

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Treatment Plan Creation Performance', () => {
    it('should handle multiple concurrent treatment plan creations', async () => {
      const startTime = Date.now();
      const numberOfRequests = 100;
      const requests = Array(numberOfRequests)
        .fill(null)
        .map(() => createTreatmentPlan());

      const results = await Promise.all(requests);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const averageTime = totalTime / numberOfRequests;

      expect(results).toHaveLength(numberOfRequests);
      expect(averageTime).toBeLessThan(50); // Average response time should be less than 50ms
      console.log(`Average response time: ${averageTime}ms`);
    });
  });

  describe('Emergency Assessment Performance', () => {
    const handleEmergencyAssessment = async () => {
      return treatmentService.handleEmergencyAssessment('123', {
        severity: 'HIGH',
        condition: 'ALLERGIC_REACTION',
      });
    };

    it('should handle multiple concurrent emergency assessments', async () => {
      const startTime = Date.now();
      const numberOfRequests = 100;
      const requests = Array(numberOfRequests)
        .fill(null)
        .map(() => handleEmergencyAssessment());

      await Promise.all(requests);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const averageTime = totalTime / numberOfRequests;

      expect(averageTime).toBeLessThan(30); // Average response time should be less than 30ms
      console.log(`Average response time: ${averageTime}ms`);
    });
  });

  describe('Treatment Progress Update Performance', () => {
    let treatmentPlanId: string;

    beforeAll(async () => {
      const plan = await createTreatmentPlan();
      treatmentPlanId = plan.id;
    });

    const updateTreatmentProgress = async () => {
      return treatmentService.updateTreatmentProgress(treatmentPlanId, {
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
      });
    };

    it('should handle multiple concurrent progress updates', async () => {
      const startTime = Date.now();
      const numberOfRequests = 100;
      const requests = Array(numberOfRequests)
        .fill(null)
        .map(() => updateTreatmentProgress());

      const results = await Promise.all(requests);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const averageTime = totalTime / numberOfRequests;

      expect(results).toHaveLength(numberOfRequests);
      expect(averageTime).toBeLessThan(40); // Average response time should be less than 40ms
      console.log(`Average response time: ${averageTime}ms`);
    });
  });
}); 