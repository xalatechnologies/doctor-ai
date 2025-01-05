import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('EmergencyController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));
    await app.init();
  });

  it('/emergency/assess (POST) - should assess emergency level', () => {
    return request(app.getHttpServer())
      .post('/emergency/assess')
      .send({
        primarySymptoms: [
          {
            symptom: 'chest_pain',
            severity: 8,
            duration: '30 minutes',
            frequency: 'constant',
            characteristics: ['sharp', 'radiating to left arm']
          }
        ],
        vitalSigns: {
          bloodPressure: '160/95',
          heartRate: 95,
          temperature: 37.2,
          oxygenSaturation: 96,
          respiratoryRate: 18
        }
      })
      .expect(200)
      .expect(res => {
        expect(res.body.status).toBe('success');
        expect(res.body.data).toHaveProperty('emergencyLevel');
        expect(res.body.data).toHaveProperty('recommendations');
      });
  });

  afterAll(async () => {
    await app.close();
  });
}); 