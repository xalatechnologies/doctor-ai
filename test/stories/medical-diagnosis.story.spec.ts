import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { MedicalModule } from '../../src/medical/medical.module';
import { connectToWebSocket } from '../helpers/websocket.helper';
import { submitVitals } from '../helpers/vitals.helper';

describe('Medical Diagnosis Stories', () => {
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

  describe('Story: Emergency Assessment', () => {
    it('should assess chest pain as high priority emergency', async () => {
      // Given a patient with severe chest pain and concerning vitals
      const symptoms = {
        primary: 'severe chest pain',
        duration: '30 minutes',
        vitals: {
          bloodPressure: '160/95',
          heartRate: 110,
          oxygenSaturation: 92
        },
        history: {
          age: 65,
          conditions: ['hypertension']
        }
      };

      // When they submit their symptoms
      const response = await request(app.getHttpServer())
        .post('/emergency/assess')
        .send(symptoms)
        .expect(200);

      // Then they should receive an urgent assessment
      expect(response.body).toMatchObject({
        urgencyLevel: 'high',
        recommendedAction: 'immediate_emergency_care',
        timeframe: 'immediate',
        reasoning: expect.stringContaining('possible cardiac event')
      });
    });
  });

  describe('Story: Symptom Analysis', () => {
    it('should provide comprehensive analysis for chronic symptoms', async () => {
      // Given a patient with ongoing symptoms
      const symptoms = {
        primary: 'persistent cough',
        duration: '3 weeks',
        characteristics: ['dry', 'worse at night'],
        associated: ['mild fever', 'fatigue'],
        history: {
          smoking: 'former',
          recentIllness: 'none'
        }
      };

      // When they request an analysis
      const response = await request(app.getHttpServer())
        .post('/symptoms/analyze')
        .send(symptoms)
        .expect(200);

      // Then they should receive a detailed analysis
      expect(response.body).toMatchObject({
        possibleConditions: expect.arrayContaining(['post-viral cough', 'asthma']),
        confidenceScores: expect.any(Object),
        recommendedTests: expect.arrayContaining(['chest x-ray']),
        urgencyLevel: 'moderate'
      });
    });
  });

  describe('Story: Treatment Recommendations', () => {
    it('should provide personalized treatment plan', async () => {
      // Given a patient with a diagnosed condition
      const condition = {
        diagnosis: 'type 2 diabetes',
        metrics: {
          a1c: 7.8,
          fastingGlucose: 145
        },
        currentMedications: ['metformin'],
        lifestyle: {
          diet: 'regular',
          exercise: 'sedentary'
        }
      };

      // When they request treatment recommendations
      const response = await request(app.getHttpServer())
        .post('/recommendations/treatment')
        .send(condition)
        .expect(200);

      // Then they should receive a comprehensive plan
      expect(response.body).toMatchObject({
        medications: expect.arrayContaining(['metformin adjustment']),
        lifestyle: {
          diet: expect.arrayContaining(['low carb options']),
          exercise: expect.arrayContaining(['30 min daily walk'])
        },
        monitoring: {
          frequency: 'daily',
          metrics: ['blood glucose']
        }
      });
    });
  });

  describe('Story: Multi-Provider Orchestration', () => {
    it('should failover to backup provider when primary fails', async () => {
      // Given a system with multiple LLM providers
      const symptoms = {
        description: 'severe headache with vision changes',
        duration: '2 hours'
      };

      // When the primary provider fails
      jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('OpenAI timeout'));

      // Then the system should failover and still provide analysis
      const response = await request(app.getHttpServer())
        .post('/symptoms/analyze')
        .send(symptoms)
        .expect(200);

      expect(response.body).toMatchObject({
        provider: expect.stringMatching(/anthropic|cohere/),
        analysis: expect.any(Object),
        confidence: expect.any(Number)
      });
    });
  });

  describe('Story: Medical History Analysis', () => {
    it('should analyze patterns in patient history', async () => {
      // Given a patient with multiple recorded visits
      const patientId = 'test-patient-1';
      
      // When requesting a history analysis
      const response = await request(app.getHttpServer())
        .get(`/history/analyze/${patientId}`)
        .expect(200);

      // Then they should receive pattern analysis
      expect(response.body).toMatchObject({
        patterns: expect.any(Array),
        trends: {
          symptoms: expect.any(Object),
          vitals: expect.any(Object)
        },
        recommendations: expect.any(Array)
      });
    });
  });

  describe('Story: Real-time Monitoring', () => {
    it('should alert on concerning vital trends', async () => {
      // Given a monitored patient
      const patientId = 'test-patient-2';
      const vitals = {
        bloodPressure: ['140/90', '150/95', '165/100'],
        timestamps: [
          new Date(Date.now() - 3000),
          new Date(Date.now() - 2000),
          new Date(Date.now() - 1000)
        ]
      };

      // When vitals show concerning trend
      const alerts = [];
      const ws = await connectToWebSocket(`/monitoring/${patientId}`);
      ws.on('alert', (alert) => alerts.push(alert));

      await submitVitals(app, patientId, vitals);

      // Then appropriate alerts should be triggered
      expect(alerts).toContainEqual(expect.objectContaining({
        type: 'vital_trend',
        severity: 'high',
        metric: 'blood_pressure',
        trend: 'increasing'
      }));
    });
  });
}); 