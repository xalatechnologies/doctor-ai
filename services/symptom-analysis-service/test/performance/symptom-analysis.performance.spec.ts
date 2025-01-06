import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { SuperTest, Test as SuperTestTest, Response } from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SymptomAnalysisController } from '@controllers/symptom-analysis.controller';
import { SymptomAnalysisService } from '@services/symptom-analysis.service';
import { RabbitMQService } from '@rabbitmq/rabbitmq.service';
import { RabbitMQModule } from '@rabbitmq/rabbitmq.module';
import configuration from '@config/configuration';

describe('SymptomAnalysis Performance Tests', () => {
  let app: INestApplication;
  let symptomAnalysisService: SymptomAnalysisService;
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
    symptomAnalysisService = moduleFixture.get<SymptomAnalysisService>(SymptomAnalysisService);
    rabbitMQService = moduleFixture.get<RabbitMQService>(RabbitMQService);
    httpServer = request(app.getHttpServer());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  async function measureAverageResponseTime(
    requestFn: () => Promise<any>,
    iterations: number
  ): Promise<number> {
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime();
      await requestFn();
      const end = process.hrtime(start);
      const timeInMs = (end[0] * 1000) + (end[1] / 1000000);
      times.push(timeInMs);
    }

    return times.reduce((a, b) => a + b) / times.length;
  }

  describe('HTTP Endpoint Performance', () => {
    it('should handle single requests within acceptable time', async () => {
      const symptomData = {
        description: 'test symptom',
        primarySymptom: 'headache',
        painLevel: 5,
        severityLevel: 4,
        duration: 'few hours',
      };

      const averageTime = await measureAverageResponseTime(
        () => httpServer
          .post('/symptom-analysis/analyze')
          .send(symptomData),
        10
      );

      expect(averageTime).toBeLessThan(100); // Response time should be less than 100ms
    });

    it('should handle concurrent requests efficiently', async () => {
      const symptomData = {
        description: 'test symptom',
        primarySymptom: 'headache',
        painLevel: 5,
        severityLevel: 4,
        duration: 'few hours',
      };

      const concurrentRequests = 50;
      const requests = Array(concurrentRequests).fill(null).map(() =>
        httpServer
          .post('/symptom-analysis/analyze')
          .send(symptomData)
      );

      const start = process.hrtime();
      const responses = await Promise.all(requests);
      const end = process.hrtime(start);
      const totalTimeInMs = (end[0] * 1000) + (end[1] / 1000000);

      expect(responses).toHaveLength(concurrentRequests);
      expect(totalTimeInMs / concurrentRequests).toBeLessThan(50); // Average time per request in concurrent scenario
      responses.forEach((response: Response) => {
        expect(response.status).toBe(201);
      });
    });

    it('should maintain performance under sustained load', async () => {
      const symptomData = {
        description: 'test symptom',
        primarySymptom: 'headache',
        painLevel: 5,
        severityLevel: 4,
        duration: 'few hours',
      };

      const requestsPerBatch = 10;
      const numberOfBatches = 5;
      const responseTimes: number[] = [];

      for (let batch = 0; batch < numberOfBatches; batch++) {
        const start = process.hrtime();
        const requests = Array(requestsPerBatch).fill(null).map(() =>
          httpServer
            .post('/symptom-analysis/analyze')
            .send(symptomData)
        );
        await Promise.all(requests);
        const end = process.hrtime(start);
        const batchTimeInMs = (end[0] * 1000) + (end[1] / 1000000);
        responseTimes.push(batchTimeInMs / requestsPerBatch);

        // Add delay between batches to simulate real-world usage
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const averageBatchTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
      const variance = responseTimes.reduce((a, b) => a + Math.pow(b - averageBatchTime, 2), 0) / responseTimes.length;

      expect(averageBatchTime).toBeLessThan(50); // Average time per request
      expect(variance).toBeLessThan(100); // Variance in response times should be low
    });
  });

  describe('RabbitMQ Message Processing Performance', () => {
    it('should process messages within acceptable time', async () => {
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

      const averageTime = await measureAverageResponseTime(
        () => app.get(SymptomAnalysisController).handleEmergencyAssessment(emergencyData),
        10
      );

      expect(averageTime).toBeLessThan(50); // Message processing should be faster than HTTP
    });

    it('should handle message batches efficiently', async () => {
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

      const batchSize = 20;
      const start = process.hrtime();
      
      await Promise.all(
        Array(batchSize).fill(null).map(() =>
          app.get(SymptomAnalysisController).handleEmergencyAssessment(emergencyData)
        )
      );

      const end = process.hrtime(start);
      const totalTimeInMs = (end[0] * 1000) + (end[1] / 1000000);
      const averageTimePerMessage = totalTimeInMs / batchSize;

      expect(averageTimePerMessage).toBeLessThan(30); // Average time per message in batch
    });
  });

  describe('Memory Usage', () => {
    it('should maintain stable memory usage under load', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const requestsPerBatch = 100;
      const numberOfBatches = 5;
      const memoryMeasurements: number[] = [];

      const symptomData = {
        description: 'test symptom',
        primarySymptom: 'headache',
        painLevel: 5,
        severityLevel: 4,
        duration: 'few hours',
      };

      for (let batch = 0; batch < numberOfBatches; batch++) {
        const requests = Array(requestsPerBatch).fill(null).map(() =>
          httpServer
            .post('/symptom-analysis/analyze')
            .send(symptomData)
        );
        await Promise.all(requests);
        
        const currentMemory = process.memoryUsage().heapUsed;
        memoryMeasurements.push(currentMemory);

        // Add delay between batches to allow for garbage collection
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const memoryIncrease = Math.max(...memoryMeasurements) - initialMemory;
      const memoryIncreasePerRequest = memoryIncrease / (requestsPerBatch * numberOfBatches);

      expect(memoryIncreasePerRequest).toBeLessThan(1024); // Less than 1KB per request on average
    });
  });

  describe('CPU Usage', () => {
    it('should handle CPU-intensive operations efficiently', async () => {
      const complexSymptomData = {
        description: 'multiple severe symptoms',
        primarySymptom: 'chest pain',
        painLevel: 9,
        severityLevel: 8,
        duration: 'acute',
        secondarySymptoms: Array(20).fill('various symptoms'), // Large array of symptoms
        alleviatingFactors: Array(10).fill('various factors'),
        aggravatingFactors: Array(10).fill('various factors'),
        currentMedications: Array(10).fill('various medications'),
        patientHistory: 'extensive medical history with multiple conditions',
      };

      const start = process.hrtime();
      const response = await httpServer
        .post('/symptom-analysis/analyze')
        .send(complexSymptomData);
      const end = process.hrtime(start);
      const timeInMs = (end[0] * 1000) + (end[1] / 1000000);

      expect(response.status).toBe(201);
      expect(timeInMs).toBeLessThan(200); // Complex analysis should complete within 200ms
    });
  });
}); 