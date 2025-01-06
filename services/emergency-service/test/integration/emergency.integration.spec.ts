import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@app/app.module';
import { EmergencyCategory, EmergencySeverity } from '@interfaces/emergency.interface';

describe('Emergency Service Integration Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /emergency/assess', () => {
    it('should assess a high-priority emergency', () => {
      return request(app.getHttpServer())
        .post('/emergency/assess')
        .send({
          description: 'severe chest pain with shortness of breath',
          age: '65',
          existingConditions: ['hypertension'],
          medications: ['aspirin'],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.severity).toBe(EmergencySeverity.HIGH);
          expect(res.body.category).toBe(EmergencyCategory.CARDIAC);
          expect(res.body.requiresAmbulance).toBe(true);
          expect(res.body.triageScore).toBe(10);
        });
    });

    it('should handle invalid input data', () => {
      return request(app.getHttpServer())
        .post('/emergency/assess')
        .send({
          description: '',
          age: '',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('Missing required emergency data');
        });
    });

    it('should process multiple concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/emergency/assess')
          .send({
            description: 'chest pain',
            age: '60',
          })
      );

      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.severity).toBeDefined();
        expect(response.body.category).toBeDefined();
      });
    });
  });

  describe('Health Check Integration', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
          expect(res.body.info.rabbitmq.status).toBe('up');
        });
    });
  });

  describe('RabbitMQ Integration', () => {
    it('should process messages through RabbitMQ', async () => {
      // This test would require setting up a RabbitMQ connection
      // and testing the message processing pipeline
      // Implementation depends on your RabbitMQ setup
    });
  });
}); 