import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { CreateTreatmentDto } from '@dto/create-treatment.dto';
import { TreatmentType, TreatmentPriority, TreatmentStatus } from '@interfaces/treatment.interface';
import { MedicationDto } from '@dto/medication.dto';
import { FollowUpScheduleDto } from '@dto/follow-up-schedule.dto';

describe('Treatment Service (e2e)', () => {
  let app: INestApplication;

  const mockMedication: MedicationDto = {
    name: 'Amoxicillin',
    dosage: '500mg',
    frequency: 'Three times daily',
    duration: 7,
    instructions: ['Take with food'],
    sideEffects: ['Nausea', 'Diarrhea'],
  };

  const mockFollowUp: FollowUpScheduleDto = {
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'Check-up',
    provider: 'Dr. Smith',
    notes: 'Review progress',
  };

  const createTreatmentDto: CreateTreatmentDto = {
    patientId: 'PAT-123',
    type: TreatmentType.MEDICATION,
    description: 'Antibiotic treatment for infection',
    priority: TreatmentPriority.HIGH,
    medications: [mockMedication],
    instructions: ['Complete full course of antibiotics'],
    duration: 7,
    frequency: 'Daily',
    startDate: new Date().toISOString(),
    followUpSchedule: [mockFollowUp],
  };

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

  describe('/treatment (POST)', () => {
    it('should create a new treatment plan', () => {
      return request(app.getHttpServer())
        .post('/treatment')
        .send(createTreatmentDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.patientId).toBe(createTreatmentDto.patientId);
          expect(res.body.type).toBe(createTreatmentDto.type);
          expect(res.body.status).toBe(TreatmentStatus.PENDING);
        });
    });

    it('should reject invalid treatment data', () => {
      return request(app.getHttpServer())
        .post('/treatment')
        .send({
          patientId: 'PAT-123',
          // Missing required fields
        })
        .expect(400);
    });
  });

  describe('/treatment/:id/progress (PUT)', () => {
    let treatmentId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/treatment')
        .send(createTreatmentDto);
      treatmentId = response.body.id;
    });

    it('should update treatment progress', () => {
      return request(app.getHttpServer())
        .put(`/treatment/${treatmentId}/progress`)
        .send({
          status: TreatmentStatus.IN_PROGRESS,
          notes: 'Patient showing improvement',
          observations: ['Reduced fever'],
          complications: [],
          adjustments: [],
          nextCheckupDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.treatmentPlanId).toBe(treatmentId);
          expect(res.body.status).toBe(TreatmentStatus.IN_PROGRESS);
        });
    });

    it('should reject invalid progress data', () => {
      return request(app.getHttpServer())
        .put(`/treatment/${treatmentId}/progress`)
        .send({
          // Missing required fields
        })
        .expect(400);
    });

    it('should handle non-existent treatment', () => {
      return request(app.getHttpServer())
        .put('/treatment/non-existent-id/progress')
        .send({
          status: TreatmentStatus.IN_PROGRESS,
          notes: 'Test notes',
        })
        .expect(404);
    });
  });
}); 