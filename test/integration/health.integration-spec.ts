import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { MedicalModule } from '../../src/medical/medical.module';
import { Redis } from 'ioredis';
import { SupabaseClient } from '@supabase/supabase-js';

describe('Health Integration', () => {
  let app: INestApplication;
  let redis: Redis;
  let supabase: SupabaseClient;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [MedicalModule],
    }).compile();

    app = moduleRef.createNestApplication();
    redis = app.get('REDIS_CLIENT');
    await app.init();
  });

  afterAll(async () => {
    await redis.quit();
    await app.close();
  });

  describe('System Health', () => {
    it('should check redis connectivity', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body.services.redis.status).toBe('healthy');
    });

    it('should check database connectivity', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/ready')
        .expect(200);

      expect(response.body.dependencies.database).toBe('healthy');
    });

    it('should collect metrics over time', async () => {
      // Make some requests
      await Promise.all([
        request(app.getHttpServer()).get('/health'),
        request(app.getHttpServer()).get('/health'),
        request(app.getHttpServer()).get('/health')
      ]);

      const metrics = await request(app.getHttpServer())
        .get('/health/metrics')
        .expect(200);

      expect(metrics.body.totalRequests).toBeGreaterThanOrEqual(3);
    });
  });
}); 