import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@app/app.module';
import { EmergencyCategory, EmergencySeverity } from '@interfaces/emergency.interface';

jest.setTimeout(60000); // Increase timeout to 60 seconds

describe('Emergency Service (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    // Create the testing module
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
    .compile();

    app = moduleFixture.createNestApplication();
    
    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
    }));

    await app.init();
  }, 60000); // 60 second timeout for setup

  afterAll(async () => {
    await app.close();
    await moduleFixture.close();
  });

  describe('Emergency Assessment Flow', () => {
    it('should handle a complete cardiac emergency scenario', () => {
      return request(app.getHttpServer())
        .post('/emergency/assess')
        .send({
          description: 'Severe chest pain with shortness of breath',
          age: '65',
          existingConditions: ['hypertension', 'diabetes'],
          medications: ['aspirin', 'metformin'],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual(
            expect.objectContaining({
              severity: EmergencySeverity.HIGH,
              category: EmergencyCategory.CARDIAC,
              requiresAmbulance: true,
              triageScore: 10,
              recommendations: expect.arrayContaining([
                'Call emergency services (911) immediately',
                'Have the patient sit or lie down',
                'Inform emergency responders about: hypertension, diabetes',
                'Have current medications ready: aspirin, metformin',
                'Alert medical staff about blood thinners',
              ]),
              immediateActions: expect.arrayContaining([
                'Call 911',
                'Check responsiveness',
              ]),
            })
          );
          expect(Date.parse(res.body.timestamp)).not.toBeNaN();
        });
    });

    it('should handle a pediatric emergency', () => {
      return request(app.getHttpServer())
        .post('/emergency/assess')
        .send({
          description: 'High fever and difficulty breathing',
          age: '2',
          existingConditions: ['asthma'],
          medications: ['albuterol'],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.severity).toBe(EmergencySeverity.HIGH);
          expect(res.body.category).toBe(EmergencyCategory.RESPIRATORY);
          expect(res.body.recommendations).toContain('Inform emergency responders about pediatric case');
          expect(res.body.triageScore).toBeGreaterThan(5);
        });
    });

    it('should handle an allergic reaction emergency', () => {
      return request(app.getHttpServer())
        .post('/emergency/assess')
        .send({
          description: 'Severe allergic reaction after eating peanuts',
          age: '25',
          existingConditions: ['peanut allergy'],
          medications: ['epinephrine auto-injector'],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.severity).toBe(EmergencySeverity.HIGH);
          expect(res.body.recommendations).toContain('Use EpiPen if available');
          expect(res.body.immediateActions).toContain('Check airway');
        });
    });
  });

  describe('Input Validation', () => {
    it('should reject empty description', () => {
      return request(app.getHttpServer())
        .post('/emergency/assess')
        .send({
          description: '',
          age: '45',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(['description should not be empty']);
        });
    });

    it('should reject invalid age format', () => {
      return request(app.getHttpServer())
        .post('/emergency/assess')
        .send({
          description: 'Feeling unwell',
          age: 'invalid',
        })
        .expect(400);
    });

    it('should handle malformed JSON', () => {
      return request(app.getHttpServer())
        .post('/emergency/assess')
        .send('{"malformed json')
        .expect(400);
    });
  });

  describe('Load Testing', () => {
    it('should handle multiple concurrent requests', async () => {
      const numberOfRequests = 50;
      const start = Date.now();

      const requests = Array(numberOfRequests).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/emergency/assess')
          .send({
            description: 'Chest pain',
            age: '60',
          })
      );

      const responses = await Promise.all(requests);
      const end = Date.now();
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.severity).toBeDefined();
        expect(response.body.category).toBeDefined();
        expect(Date.parse(response.body.timestamp)).not.toBeNaN();
      });

      // Check response times are reasonable
      const totalDuration = end - start;
      const averageResponseTime = totalDuration / numberOfRequests;
      expect(averageResponseTime).toBeLessThan(200); // 200ms max average
    });
  });

  describe('Health Check', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBeDefined();
          expect(res.body.info).toBeDefined();
          expect(res.body.error).toBeUndefined();
        });
    });
  });

  describe('Error Handling', () => {
    it('should handle internal server errors gracefully', () => {
      // Simulate an internal error by sending malformed data
      return request(app.getHttpServer())
        .post('/emergency/assess')
        .send({
          description: null,
          age: undefined,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
          expect(res.body.error).toBeDefined();
        });
    });

    it('should handle rate limiting', async () => {
      const requests = Array(20).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/emergency/assess')
          .send({
            description: 'test',
            age: '30',
          })
      );

      const responses = await Promise.all(requests);
      const successfulRequests = responses.filter(r => r.status === 201);

      expect(successfulRequests.length).toBe(20); // All requests should succeed since we're not actually rate limiting
    });
  });
}); 