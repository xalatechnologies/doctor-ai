import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { MedicalModule } from '../src/medical/medical.module';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [MedicalModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/health', () => {
    it('GET should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect(res => {
          expect(res.body.status).toBe('ok');
          expect(res.body.services).toBeDefined();
        });
    });

    it('GET /health/metrics should return prometheus metrics', () => {
      return request(app.getHttpServer())
        .get('/health/metrics')
        .expect(200)
        .expect(res => {
          expect(res.body.totalRequests).toBeDefined();
          expect(res.body.successRate).toBeDefined();
        });
    });
  });
}); 