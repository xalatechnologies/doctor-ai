import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { LoggerService } from '../../src/common/logger/logger.service';
import { MessagingService } from '../../src/common/messaging/messaging.service';
import { SupabaseService } from '../../src/common/database/supabase.service';
import { LLMService } from '../../src/common/llm/llm.service';
import { AIOrchestrationService } from '../../src/core/ai/ai-orchestration.service';

describe('AI Orchestration (Integration)', () => {
  let app: INestApplication;
  let llmService: LLMService;
  let aiOrchestrationService: AIOrchestrationService;

  const mockLLMResponse = {
    content: JSON.stringify({
      clinical_assessment: {
        severity_assessment: { level: 'MODERATE' },
      },
      differential_diagnosis: {
        primary_diagnosis: { condition: 'Test Condition' },
      },
      management_plan: {
        immediate_actions: ['action1'],
      },
    }),
    tokenUsage: 100,
    provider: 'medpalm',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LoggerService)
      .useValue({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
      })
      .overrideProvider(MessagingService)
      .useValue({
        publish: jest.fn(),
      })
      .overrideProvider(SupabaseService)
      .useValue({
        query: jest.fn(),
        insert: jest.fn(),
      })
      .overrideProvider(LLMService)
      .useValue({
        analyzeSymptoms: jest.fn().mockResolvedValue(mockLLMResponse),
        findTemplate: jest.fn().mockResolvedValue(mockLLMResponse),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    llmService = moduleFixture.get(LLMService);
    aiOrchestrationService = moduleFixture.get(AIOrchestrationService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/symptom-analysis (POST)', () => {
    const mockSymptoms = {
      symptoms: [
        {
          name: 'fever',
          severity: 8,
          duration: '2 days',
          characteristics: ['continuous', 'worsening'],
        },
        {
          name: 'cough',
          severity: 6,
          duration: '3 days',
          characteristics: ['dry', 'persistent'],
        },
      ],
      vitalSigns: {
        temperature: 39.2,
        heartRate: 95,
        respiratoryRate: 20,
        bloodPressure: '130/85',
        oxygenSaturation: 97,
      },
    };

    it('should analyze symptoms using multiple LLMs and return aggregated results', async () => {
      const response = await request(app.getHttpServer())
        .post('/symptom-analysis')
        .send(mockSymptoms)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          clinical_assessment: expect.any(Object),
          differential_diagnosis: expect.any(Object),
          management_plan: expect.any(Object),
        }),
        metadata: expect.objectContaining({
          confidence: expect.any(Number),
          providers: expect.arrayContaining(['medpalm']),
          responseTime: expect.any(Number),
        }),
      });

      expect(response.body.metadata.confidence).toBeGreaterThan(0.7);
    });

    it('should handle LLM provider failures with fallback mechanism', async () => {
      // Simulate primary provider failure
      jest.spyOn(llmService, 'analyzeSymptoms')
        .mockRejectedValueOnce(new Error('Primary provider failed'))
        .mockResolvedValueOnce(mockLLMResponse);

      const response = await request(app.getHttpServer())
        .post('/symptom-analysis')
        .send(mockSymptoms)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.metadata.providers).toHaveLength(1);
      expect(llmService.analyzeSymptoms).toHaveBeenCalledTimes(2);
    });

    it('should validate input data and return 400 for invalid input', async () => {
      const invalidSymptoms = {
        symptoms: 'invalid',
      };

      const response = await request(app.getHttpServer())
        .post('/symptom-analysis')
        .send(invalidSymptoms)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String),
      });
    });
  });

  describe('/adaptive-questions (POST)', () => {
    const mockInitialSymptoms = {
      primarySymptom: 'headache',
      severity: 7,
      duration: '24 hours',
    };

    it('should generate relevant follow-up questions based on initial symptoms', async () => {
      const response = await request(app.getHttpServer())
        .post('/adaptive-questions')
        .send(mockInitialSymptoms)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          questions: expect.any(Array),
          reasoning: expect.any(String),
        }),
        metadata: expect.objectContaining({
          confidence: expect.any(Number),
          questionCount: expect.any(Number),
        }),
      });

      expect(response.body.data.questions.length).toBeGreaterThan(0);
    });

    it('should adapt questions based on previous responses', async () => {
      const mockPreviousResponses = {
        primarySymptom: 'headache',
        responses: [
          {
            question: 'Is the pain one-sided?',
            answer: 'yes',
          },
          {
            question: 'Do you experience sensitivity to light?',
            answer: 'yes',
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/adaptive-questions')
        .send(mockPreviousResponses)
        .expect(201);

      expect(response.body.data.questions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            relevance: expect.any(Number),
            category: expect.any(String),
          }),
        ]),
      );

      expect(response.body.data.reasoning).toContain('migraine');
    });
  });

  describe('Performance and Reliability', () => {
    it('should maintain response times within acceptable limits', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .post('/symptom-analysis')
        .send({
          symptoms: [{ name: 'fever', severity: 5 }],
        });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });

    it('should maintain high confidence scores across multiple requests', async () => {
      const responses = await Promise.all([
        request(app.getHttpServer())
          .post('/symptom-analysis')
          .send({ symptoms: [{ name: 'fever', severity: 5 }] }),
        request(app.getHttpServer())
          .post('/symptom-analysis')
          .send({ symptoms: [{ name: 'cough', severity: 6 }] }),
      ]);

      const confidenceScores = responses.map(
        (response) => response.body.metadata.confidence,
      );

      const averageConfidence =
        confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;

      expect(averageConfidence).toBeGreaterThan(0.7);
    });

    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 5;
      const requests = Array(concurrentRequests).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/symptom-analysis')
          .send({ symptoms: [{ name: 'fever', severity: 5 }] })
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });
  });
}); 