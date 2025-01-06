import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { SuperTest, Test as SuperTestTest } from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SymptomAnalysisController } from '@controllers/symptom-analysis.controller';
import { SymptomAnalysisService } from '@services/symptom-analysis.service';
import { RabbitMQService } from '@rabbitmq/rabbitmq.service';
import { RabbitMQModule } from '@rabbitmq/rabbitmq.module';
import configuration from '@config/configuration';

interface SymptomAnalysisResponse {
  primarySymptom: string;
  severity: {
    level: number;
    description: string;
  };
  urgencyLevel: string;
  recommendations: string[];
}

interface ErrorResponse {
  message: string;
}

interface HealthResponse {
  status: string;
  info: Record<string, unknown>;
  details: Record<string, unknown>;
}

describe('SymptomAnalysis (e2e)', () => {
  let app: INestApplication;
  let rabbitMQService: RabbitMQService;
  let httpServer: SuperTest<SuperTestTest>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [configuration],
          isGlobal: true,
        }),
        ClientsModule.registerAsync([
          {
            name: 'RABBITMQ_SERVICE',
            useFactory: () => ({
              transport: Transport.RMQ,
              options: {
                urls: ['amqp://localhost:5672'],
                queue: 'symptom_analysis_queue_test',
                queueOptions: {
                  durable: true,
                },
              },
            }),
          },
        ]),
        RabbitMQModule,
      ],
      controllers: [SymptomAnalysisController],
      providers: [SymptomAnalysisService],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    rabbitMQService = moduleFixture.get<RabbitMQService>(RabbitMQService);
    httpServer = request(app.getHttpServer());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/symptom-analysis/analyze (POST)', () => {
    it('should analyze symptoms successfully', () => {
      const symptomData = {
        description: 'severe chest pain',
        primarySymptom: 'chest pain',
        painLevel: 8,
        severityLevel: 7,
        duration: 'acute',
        secondarySymptoms: ['shortness of breath'],
        alleviatingFactors: ['rest'],
        aggravatingFactors: ['movement'],
        currentMedications: ['aspirin'],
        patientHistory: 'hypertension',
      };

      return httpServer
        .post('/symptom-analysis/analyze')
        .send(symptomData)
        .expect(201)
        .expect((res: request.Response) => {
          const body = res.body as SymptomAnalysisResponse;
          expect(body).toBeDefined();
          expect(body.primarySymptom).toBe(symptomData.primarySymptom);
          expect(body.severity.level).toBeGreaterThanOrEqual(symptomData.severityLevel);
          expect(body.urgencyLevel).toBe('HIGH');
          expect(body.recommendations).toBeDefined();
          expect(body.recommendations.length).toBeGreaterThan(0);
        });
    });

    it('should validate required fields', () => {
      const invalidData = {
        description: 'test',
      };

      return httpServer
        .post('/symptom-analysis/analyze')
        .send(invalidData)
        .expect(400)
        .expect((res: request.Response) => {
          const body = res.body as ErrorResponse;
          expect(body.message).toContain('primarySymptom');
          expect(body.message).toContain('painLevel');
          expect(body.message).toContain('severityLevel');
        });
    });

    it('should validate field constraints', () => {
      const invalidData = {
        description: 'test',
        primarySymptom: 'headache',
        painLevel: 11, // Should be 1-10
        severityLevel: 0, // Should be 1-10
        duration: 'invalid',
      };

      return httpServer
        .post('/symptom-analysis/analyze')
        .send(invalidData)
        .expect(400)
        .expect((res: request.Response) => {
          const body = res.body as ErrorResponse;
          expect(body.message).toContain('painLevel');
          expect(body.message).toContain('severityLevel');
        });
    });
  });

  describe('/health (GET)', () => {
    it('should return health check status', () => {
      return httpServer
        .get('/health')
        .expect(200)
        .expect((res: request.Response) => {
          const body = res.body as HealthResponse;
          expect(body.status).toBe('ok');
          expect(body.info).toBeDefined();
          expect(body.details).toBeDefined();
        });
    });
  });

  describe('RabbitMQ Message Handling', () => {
    it('should handle emergency assessment messages', async () => {
      const emergencyData = {
        assessment: {
          category: 'CARDIAC',
          severity: 'HIGH',
          immediateActions: ['Call emergency services'],
        },
        patientData: {
          medications: ['aspirin'],
        },
      };

      const publishSpy = jest.spyOn(rabbitMQService, 'publishEmergencyAssessment');

      // Simulate receiving a message
      await app.get(SymptomAnalysisController).handleEmergencyAssessment(emergencyData);

      expect(publishSpy).toHaveBeenCalledWith(
        'symptom.emergency.analyzed',
        expect.objectContaining({
          emergencyData,
          detailedAnalysis: expect.any(Object),
        }),
      );
    });

    it('should handle symptom analysis messages', async () => {
      const symptomData = {
        description: 'test symptom',
        primarySymptom: 'headache',
        painLevel: 5,
        severityLevel: 4,
        duration: 'few hours',
      };

      const publishSpy = jest.spyOn(rabbitMQService, 'publishEmergencyAssessment');

      // Simulate receiving a message
      await app.get(SymptomAnalysisController).analyzeSymptom(symptomData);

      expect(publishSpy).toHaveBeenCalledWith(
        'symptom.analyzed',
        expect.objectContaining({
          originalData: symptomData,
        }),
      );
    });
  });

  describe('Rate Limiting', () => {
    it('should handle multiple concurrent requests', async () => {
      const symptomData = {
        description: 'test symptom',
        primarySymptom: 'headache',
        painLevel: 5,
        severityLevel: 4,
        duration: 'few hours',
      };

      const requests = Array(5).fill(null).map(() =>
        httpServer
          .post('/symptom-analysis/analyze')
          .send(symptomData)
      );

      const responses = await Promise.all(requests);
      responses.forEach((response: request.Response) => {
        expect(response.status).toBe(201);
        expect(response.body.primarySymptom).toBe(symptomData.primarySymptom);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle internal server errors gracefully', async () => {
      // Mock service to throw error
      jest.spyOn(app.get(SymptomAnalysisService), 'analyzeSymptom').mockRejectedValueOnce(
        new Error('Internal error')
      );

      const symptomData = {
        description: 'test symptom',
        primarySymptom: 'headache',
        painLevel: 5,
        severityLevel: 4,
        duration: 'few hours',
      };

      return httpServer
        .post('/symptom-analysis/analyze')
        .send(symptomData)
        .expect(500)
        .expect((res: request.Response) => {
          const body = res.body as ErrorResponse;
          expect(body.message).toBe('Internal server error');
        });
    });

    it('should handle RabbitMQ connection errors gracefully', async () => {
      // Mock RabbitMQ service to throw error
      jest.spyOn(rabbitMQService, 'publishEmergencyAssessment').mockRejectedValueOnce(
        new Error('Connection failed')
      );

      const symptomData = {
        description: 'test symptom',
        primarySymptom: 'headache',
        painLevel: 5,
        severityLevel: 4,
        duration: 'few hours',
      };

      return httpServer
        .post('/symptom-analysis/analyze')
        .send(symptomData)
        .expect(201) // Should still succeed even if RabbitMQ fails
        .expect((res: request.Response) => {
          const body = res.body as SymptomAnalysisResponse;
          expect(body.primarySymptom).toBe(symptomData.primarySymptom);
        });
    });
  });
}); 