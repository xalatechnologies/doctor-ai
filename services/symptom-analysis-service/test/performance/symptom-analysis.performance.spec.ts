import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@app/app.module';
import { AnalyzeSymptomDto } from '@dto/analyze-symptom.dto';
import { RabbitMQService } from '@rabbitmq/rabbitmq.service';

describe('SymptomAnalysis Performance Tests', () => {
  let app: INestApplication;
  let rabbitMQService: RabbitMQService;

  const mockRabbitMQService = {
    publishEmergencyAssessment: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RabbitMQService)
      .useValue(mockRabbitMQService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    rabbitMQService = moduleFixture.get<RabbitMQService>(RabbitMQService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Concurrent Request Handling', () => {
    const validSymptomDto: AnalyzeSymptomDto = {
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

    it('should handle multiple concurrent requests efficiently', async () => {
      const numberOfRequests = 100;
      const startTime = Date.now();

      const requests = Array(numberOfRequests)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post('/symptom-analysis/analyze')
            .send(validSymptomDto),
        );

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / numberOfRequests;

      console.log(`Performance Test Results:
        Total Requests: ${numberOfRequests}
        Total Time: ${totalTime}ms
        Average Time per Request: ${averageTime}ms`);

      // Verify all requests were successful
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
          symptomId: expect.stringMatching(/^SYM-\d+-[a-z0-9]+$/),
          primarySymptom: validSymptomDto.primarySymptom,
        });
      });

      // Performance assertions
      expect(averageTime).toBeLessThan(50); // Average response time should be under 50ms
    });
  });

  describe('Memory Usage', () => {
    it('should maintain stable memory usage under load', async () => {
      const initialMemory = process.memoryUsage();
      const numberOfRequests = 1000;
      const batchSize = 50;
      const batches = Math.ceil(numberOfRequests / batchSize);

      for (let i = 0; i < batches; i++) {
        const requests = Array(batchSize)
          .fill(null)
          .map(() =>
            request(app.getHttpServer())
              .post('/symptom-analysis/analyze')
              .send({
                description: `test symptom ${i}`,
                primarySymptom: 'headache',
                painLevel: 5,
                severityLevel: 4,
                duration: 'acute',
              }),
          );

        await Promise.all(requests);
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = {
        heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
        heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
        external: finalMemory.external - initialMemory.external,
        rss: finalMemory.rss - initialMemory.rss,
      };

      console.log('Memory Usage Increase:', {
        heapUsed: `${(memoryIncrease.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(memoryIncrease.heapTotal / 1024 / 1024).toFixed(2)}MB`,
        external: `${(memoryIncrease.external / 1024 / 1024).toFixed(2)}MB`,
        rss: `${(memoryIncrease.rss / 1024 / 1024).toFixed(2)}MB`,
      });

      // Memory leak detection
      expect(memoryIncrease.heapUsed).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    });
  });

  describe('Response Time Distribution', () => {
    it('should maintain consistent response times', async () => {
      const numberOfRequests = 100;
      const responseTimes: number[] = [];

      for (let i = 0; i < numberOfRequests; i++) {
        const startTime = Date.now();
        await request(app.getHttpServer())
          .post('/symptom-analysis/analyze')
          .send({
            description: `test symptom ${i}`,
            primarySymptom: 'headache',
            painLevel: 5,
            severityLevel: 4,
            duration: 'acute',
          });
        responseTimes.push(Date.now() - startTime);
      }

      const average = responseTimes.reduce((a, b) => a + b) / numberOfRequests;
      const sorted = responseTimes.sort((a, b) => a - b);
      const p95 = sorted[Math.floor(numberOfRequests * 0.95)];
      const p99 = sorted[Math.floor(numberOfRequests * 0.99)];

      console.log('Response Time Distribution:', {
        average: `${average.toFixed(2)}ms`,
        p95: `${p95}ms`,
        p99: `${p99}ms`,
        min: `${sorted[0]}ms`,
        max: `${sorted[numberOfRequests - 1]}ms`,
      });

      // Performance assertions
      expect(average).toBeLessThan(50); // Average should be under 50ms
      expect(p95).toBeLessThan(100); // 95th percentile should be under 100ms
      expect(p99).toBeLessThan(200); // 99th percentile should be under 200ms
    });
  });
}); 