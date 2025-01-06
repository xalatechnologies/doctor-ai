import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SymptomAnalysisController } from '@controllers/symptom-analysis.controller';
import { SymptomAnalysisService } from '@services/symptom-analysis.service';
import { RabbitMQService } from '@rabbitmq/rabbitmq.service';
import { RabbitMQModule } from '@rabbitmq/rabbitmq.module';
import configuration from '@config/configuration';

describe('Symptom Analysis Integration', () => {
  let app: INestApplication;
  let symptomAnalysisService: SymptomAnalysisService;
  let rabbitMQService: RabbitMQService;

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
            useFactory: (configService: ConfigService) => {
              const url = configService.get<string>('rabbitmq.url');
              const queue = configService.get<string>('rabbitmq.queue');
              
              if (!url || !queue) {
                throw new Error('RabbitMQ configuration is missing');
              }

              return {
                transport: Transport.RMQ,
                options: {
                  urls: [url],
                  queue,
                  queueOptions: {
                    durable: true,
                  },
                },
              };
            },
            inject: [ConfigService],
          },
        ]),
        RabbitMQModule,
      ],
      controllers: [SymptomAnalysisController],
      providers: [SymptomAnalysisService],
    }).compile();

    app = moduleFixture.createNestApplication();
    symptomAnalysisService = moduleFixture.get<SymptomAnalysisService>(SymptomAnalysisService);
    rabbitMQService = moduleFixture.get<RabbitMQService>(RabbitMQService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('RabbitMQ Integration', () => {
    it('should successfully connect to RabbitMQ', () => {
      expect(rabbitMQService).toBeDefined();
    });

    it('should publish and consume messages', async () => {
      const testMessage = {
        description: 'test symptom',
        primarySymptom: 'headache',
        painLevel: 5,
        severityLevel: 4,
        duration: 'few hours',
      };

      const publishSpy = jest.spyOn(rabbitMQService, 'publishEmergencyAssessment');
      
      await symptomAnalysisService.analyzeSymptom(testMessage);

      expect(publishSpy).toHaveBeenCalledWith(
        'symptom.analyzed',
        expect.objectContaining({
          originalData: testMessage,
        }),
      );
    });

    it('should handle emergency assessments through RabbitMQ', async () => {
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
      
      await symptomAnalysisService.handleEmergencyAssessment(emergencyData);

      expect(publishSpy).toHaveBeenCalledWith(
        'symptom.emergency.analyzed',
        expect.objectContaining({
          emergencyData,
        }),
      );
    });
  });

  describe('Service Integration', () => {
    it('should process symptom analysis end-to-end', async () => {
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

      const result = await symptomAnalysisService.analyzeSymptom(symptomData);

      expect(result).toBeDefined();
      expect(result.primarySymptom).toBe(symptomData.primarySymptom);
      expect(result.severity.level).toBeGreaterThanOrEqual(symptomData.severityLevel);
      expect(result.urgencyLevel).toBe('HIGH');
      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle concurrent symptom analyses', async () => {
      const symptoms = [
        {
          description: 'severe headache',
          primarySymptom: 'headache',
          painLevel: 7,
          severityLevel: 6,
          duration: 'few hours',
        },
        {
          description: 'stomach pain',
          primarySymptom: 'abdominal pain',
          painLevel: 5,
          severityLevel: 4,
          duration: 'few days',
        },
        {
          description: 'fever',
          primarySymptom: 'fever',
          painLevel: 3,
          severityLevel: 3,
          duration: 'one day',
        },
      ];

      const results = await Promise.all(
        symptoms.map(symptom => symptomAnalysisService.analyzeSymptom(symptom))
      );

      expect(results).toHaveLength(symptoms.length);
      results.forEach((result, index) => {
        expect(result.primarySymptom).toBe(symptoms[index].primarySymptom);
        expect(result.severity.level).toBeGreaterThanOrEqual(symptoms[index].severityLevel);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle RabbitMQ connection errors gracefully', async () => {
      // Simulate RabbitMQ connection error
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

      const result = await symptomAnalysisService.analyzeSymptom(symptomData);

      expect(result).toBeDefined();
      expect(result.primarySymptom).toBe(symptomData.primarySymptom);
    });

    it('should handle invalid message formats', async () => {
      const invalidEmergencyData = {
        assessment: {
          category: 'INVALID',
        },
      };

      await expect(
        symptomAnalysisService.handleEmergencyAssessment(invalidEmergencyData)
      ).rejects.toThrow();
    });
  });

  describe('Configuration Integration', () => {
    it('should load RabbitMQ configuration correctly', () => {
      const configService = app.get(ConfigService);
      
      expect(configService.get('rabbitmq.url')).toBeDefined();
      expect(configService.get('rabbitmq.queue')).toBeDefined();
    });

    it('should use correct RabbitMQ connection options', () => {
      const configService = app.get(ConfigService);
      const url = configService.get('rabbitmq.url');
      const queue = configService.get('rabbitmq.queue');

      expect(url).toMatch(/^amqp:\/\//);
      expect(queue).toBeTruthy();
    });
  });
}); 