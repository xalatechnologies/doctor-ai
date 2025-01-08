import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { SymptomRiskInput, MedicalReport } from '@app/common';

describe('Symptom Analysis E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete Symptom Analysis Flow', () => {
    let analysisId: string;
    let reportId: string;

    it('1. Should create initial symptom analysis', async () => {
      const analysisInput = {
        symptoms: ['severe headache', 'nausea', 'sensitivity to light'],
        medicalHistory: 'Previous migraines',
        medications: ['sumatriptan'],
        allergies: ['aspirin'],
        vitalSigns: {
          bloodPressure: '120/80',
          heartRate: 75,
          temperature: 37.0,
        },
      };

      const response = await request(app.getHttpServer())
        .post('/symptom-analysis')
        .send(analysisInput)
        .expect(201);

      expect(response.body).toEqual(expect.objectContaining({
        id: expect.any(String),
        status: 'pending',
        data: expect.objectContaining(analysisInput),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }));

      analysisId = response.body.id;
    });

    it('2. Should assess symptom risks', async () => {
      const riskInput: SymptomRiskInput = {
        symptoms: ['severe headache', 'nausea', 'sensitivity to light'],
        medicalHistory: 'Previous migraines',
        severityLevel: 8,
        age: 35,
      };

      const response = await request(app.getHttpServer())
        .post('/symptom-analysis/assess-risk')
        .send(riskInput)
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        riskLevel: expect.stringMatching(/^(LOW|MEDIUM|HIGH)$/),
        recommendations: expect.any(Array),
        urgencyLevel: expect.stringMatching(/^(LOW|MEDIUM|HIGH)$/),
        followUpRequired: expect.any(Boolean),
        timestamp: expect.any(String),
      }));
    });

    it('3. Should generate medical report', async () => {
      const response = await request(app.getHttpServer())
        .post(`/symptom-analysis/${analysisId}/generate-report`)
        .expect(200);

      const report = response.body as MedicalReport;
      expect(report).toEqual(expect.objectContaining({
        reportId: expect.any(String),
        timestamp: expect.any(String),
        patientId: expect.any(String),
        symptoms: expect.arrayContaining([
          expect.objectContaining({
            description: expect.any(String),
            severity: expect.any(Number),
            duration: expect.any(String),
            onset: expect.any(String),
            interpretation: expect.any(String),
            riskFactors: expect.any(Array),
          }),
        ]),
        vitalSigns: expect.objectContaining({
          bloodPressure: expect.any(String),
          heartRate: expect.any(Number),
          temperature: expect.any(Number),
          summary: expect.any(String),
          findings: expect.any(Array),
          requiresAttention: expect.any(Boolean),
        }),
        diagnosis: expect.objectContaining({
          primaryDiagnosis: expect.any(String),
          differentialDiagnoses: expect.any(Array),
          confidence: expect.any(Number),
        }),
        recommendations: expect.any(Array),
        followUpPlan: expect.any(Array),
        urgencyLevel: expect.stringMatching(/^(LOW|MEDIUM|HIGH)$/),
      }));

      reportId = report.reportId;
    });

    it('4. Should translate the medical report', async () => {
      const response = await request(app.getHttpServer())
        .post(`/symptom-analysis/${analysisId}/translate`)
        .send({ targetLanguage: 'es' })
        .expect(200);

      const translatedReport = response.body as MedicalReport;
      expect(translatedReport).toEqual(expect.objectContaining({
        reportId: reportId,
        timestamp: expect.any(String),
        patientId: expect.any(String),
        symptoms: expect.any(Array),
        vitalSigns: expect.any(Object),
        diagnosis: expect.any(Object),
        recommendations: expect.any(Array),
        followUpPlan: expect.any(Array),
        urgencyLevel: expect.stringMatching(/^(LOW|MEDIUM|HIGH)$/),
      }));
    });

    it('5. Should retrieve the analysis with report', async () => {
      const response = await request(app.getHttpServer())
        .get(`/symptom-analysis/${analysisId}`)
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        id: analysisId,
        status: 'completed',
        report: expect.objectContaining({
          reportId: reportId,
        }),
      }));
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid symptom input', async () => {
      const invalidInput = {
        symptoms: 'not-an-array', // Should be an array
        severityLevel: 'invalid', // Should be a number
      };

      const response = await request(app.getHttpServer())
        .post('/symptom-analysis/assess-risk')
        .send(invalidInput)
        .expect(400);

      expect(response.body).toEqual(expect.objectContaining({
        message: expect.any(Array),
        error: 'Bad Request',
      }));
    });

    it('should handle non-existent analysis', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .post(`/symptom-analysis/${nonExistentId}/generate-report`)
        .expect(404);

      await request(app.getHttpServer())
        .get(`/symptom-analysis/${nonExistentId}`)
        .expect(404);
    });

    it('should handle invalid translation request', async () => {
      const analysisId = '00000000-0000-0000-0000-000000000000';
      
      await request(app.getHttpServer())
        .post(`/symptom-analysis/${analysisId}/translate`)
        .send({ targetLanguage: '' })
        .expect(400);

      await request(app.getHttpServer())
        .post(`/symptom-analysis/${analysisId}/translate`)
        .send({})
        .expect(400);
    });
  });
}); 