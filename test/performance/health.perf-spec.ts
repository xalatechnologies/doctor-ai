import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as autocannon from 'autocannon';
import { MedicalModule } from '../../src/medical/medical.module';

describe('Health Performance Tests', () => {
  let app: INestApplication;
  let url: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [MedicalModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    
    const server = app.getHttpServer();
    url = `http://localhost:${server.address().port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should handle high load on health endpoint', async () => {
    const result = await autocannon({
      url: `${url}/health`,
      connections: 100,
      duration: 10,
      pipelining: 1,
      workers: 4
    });

    expect(result.errors).toBe(0);
    expect(result.timeouts).toBe(0);
    expect(result.latency.p99).toBeLessThan(100); // 100ms
    expect(result.requests.average).toBeGreaterThan(1000); // 1k RPS
  });
}); 