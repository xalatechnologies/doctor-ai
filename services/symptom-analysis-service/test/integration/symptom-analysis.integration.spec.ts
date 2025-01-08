import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { SymptomRiskInput } from '../../src/interfaces/symptom-risk-input.interface';
import { MedicalReportDto } from '../../src/dto/medical-report.dto';

describe('SymptomAnalysis Integration Tests', () => {
  let app: INestApplication;
  let analysisId: string;

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

  describe('POST /symptom-analysis/assess-risk', () => {
    const riskInput: SymptomRiskInput = {
      symptoms: ['headache', 'nausea'],
      medicalHistory: 'None',
      age: 30,
      vitalSigns: {
        heartRate: 75,
        temperature: 37
      }
    };

    it('should assess symptoms and return risk assessment', () => {
      return request(app.getHttpServer())
        .post('/symptom-analysis/assess-risk')
        .send(riskInput)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual(expect.objectContaining({
            riskLevel: expect.any(String),
            recommendations: expect.any(Array),
            urgencyLevel: expect.any(String),
            followUpRequired: expect.any(Boolean),
            timestamp: expect.any(String),
          }));
        });
    });

    it('should validate input data', () => {
      const invalidInput = {
        symptoms: 'not-an-array',
        severityLevel: 'not-a-number',
      };

      return request(app.getHttpServer())
        .post('/symptom-analysis/assess-risk')
        .send(invalidInput)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(expect.any(Array));
        });
    });
  });

  describe('POST /symptom-analysis', () => {
    const analysisInput = {
      symptoms: ['headache'],
      medicalHistory: 'None',
      medications: [],
      allergies: [],
      vitalSigns: {
        bloodPressure: '120/80',
        heartRate: 75,
      },
    };

    it('should create symptom analysis', () => {
      return request(app.getHttpServer())
        .post('/symptom-analysis')
        .send(analysisInput)
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual(expect.objectContaining({
            id: expect.any(String),
            status: 'pending',
            data: expect.objectContaining(analysisInput),
          }));
          analysisId = res.body.id;
        });
    });
  });

  describe('POST /symptom-analysis/:analysisId/generate-report', () => {
    it('should generate medical report', () => {
      return request(app.getHttpServer())
        .post(`/symptom-analysis/${analysisId}/generate-report`)
        .expect(200)
        .expect((res) => {
          const report = res.body as MedicalReportDto;
          expect(report).toEqual(expect.objectContaining({
            reportId: expect.any(String),
            timestamp: expect.any(String),
            patientId: expect.any(String),
            symptoms: expect.any(Array),
            vitalSigns: expect.any(Object),
            diagnosis: expect.any(Object),
            recommendations: expect.any(Array),
            followUpPlan: expect.any(Array),
            urgencyLevel: expect.any(String),
          }));
        });
    });

    it('should handle non-existent analysis', () => {
      return request(app.getHttpServer())
        .post('/symptom-analysis/non-existent-id/generate-report')
        .expect(404);
    });
  });

  describe('POST /symptom-analysis/:analysisId/translate', () => {
    it('should translate medical report', () => {
      return request(app.getHttpServer())
        .post(`/symptom-analysis/${analysisId}/translate`)
        .send({ targetLanguage: 'es' })
        .expect(200)
        .expect((res) => {
          const report = res.body as MedicalReportDto;
          expect(report).toEqual(expect.objectContaining({
            reportId: expect.any(String),
            timestamp: expect.any(String),
            patientId: expect.any(String),
            symptoms: expect.any(Array),
            vitalSigns: expect.any(Object),
            diagnosis: expect.any(Object),
            recommendations: expect.any(Array),
            followUpPlan: expect.any(Array),
            urgencyLevel: expect.any(String),
          }));
        });
    });

    it('should handle non-existent analysis', () => {
      return request(app.getHttpServer())
        .post('/symptom-analysis/non-existent-id/translate')
        .send({ targetLanguage: 'es' })
        .expect(404);
    });

    it('should validate target language', () => {
      return request(app.getHttpServer())
        .post(`/symptom-analysis/${analysisId}/translate`)
        .send({ targetLanguage: '' })
        .expect(400);
    });
  });
}); 