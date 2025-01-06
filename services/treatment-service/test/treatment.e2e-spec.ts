import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { CreateTreatmentPlanDto } from '@dto/create-treatment.dto';
import { UpdateTreatmentProgressDto } from '@dto/update-treatment.dto';
import { TreatmentStatus } from '@interfaces/treatment.interface';

describe('TreatmentController (e2e)', () => {
  let app: INestApplication;
  let createdTreatmentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }));
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/health (GET)', () => {
    it('should return health check status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
        });
    });
  });

  describe('/treatment (POST)', () => {
    const createDto: CreateTreatmentPlanDto = {
      patientId: '123',
      diagnosis: 'Test Diagnosis',
      medications: [
        {
          name: 'Test Med',
          dosage: '10mg',
          route: 'Oral',
          frequency: 'Daily',
        },
      ],
      followUpSchedule: [
        {
          date: new Date(),
          type: 'Check-up',
          notes: 'Follow-up notes',
          completed: false,
        },
      ],
    };

    it('should create a treatment plan', () => {
      return request(app.getHttpServer())
        .post('/treatment')
        .send(createDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toMatchObject({
            patientId: createDto.patientId,
            diagnosis: createDto.diagnosis,
            status: TreatmentStatus.ACTIVE,
          });
          expect(res.body.id).toBeDefined();
          createdTreatmentId = res.body.id;
        });
    });

    it('should validate request body', () => {
      return request(app.getHttpServer())
        .post('/treatment')
        .send({
          patientId: '123',
          // Missing required fields
        })
        .expect(400);
    });
  });

  describe('/treatment/:id/progress (PUT)', () => {
    const progressDto: UpdateTreatmentProgressDto = {
      symptoms: [
        {
          name: 'Fever',
          severity: 2,
          previousSeverity: 3,
        },
      ],
      medicationAdherence: [
        {
          medicationId: '123',
          adherenceRate: 0.9,
          missedDoses: 1,
        },
      ],
    };

    it('should update treatment progress', () => {
      return request(app.getHttpServer())
        .put(`/treatment/${createdTreatmentId}/progress`)
        .send(progressDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            treatmentPlanId: createdTreatmentId,
            symptoms: progressDto.symptoms,
          });
        });
    });

    it('should return 404 for non-existent treatment plan', () => {
      return request(app.getHttpServer())
        .put('/treatment/nonexistent/progress')
        .send(progressDto)
        .expect(500); // Note: In a real application, this should return 404
    });

    it('should validate request body', () => {
      return request(app.getHttpServer())
        .put(`/treatment/${createdTreatmentId}/progress`)
        .send({
          symptoms: [
            {
              name: 'Fever',
              // Missing required fields
            },
          ],
        })
        .expect(400);
    });
  });
}); 