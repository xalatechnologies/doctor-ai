import { Test, TestingModule } from '@nestjs/testing';
import { AIOrchestrationService } from './ai-orchestration.service';
import { LLMService } from '@app/common/llm/llm.service';
import { PrometheusService } from '@app/common/monitoring/prometheus.service';
import { LoggerService } from '@app/common/logger/logger.service';
import { MessagingService } from '@app/common/messaging/messaging.service';

describe('AIOrchestrationService', () => {
  let service: AIOrchestrationService;
  let llmService: jest.Mocked<LLMService>;
  let prometheusService: jest.Mocked<PrometheusService>;
  let loggerService: jest.Mocked<LoggerService>;
  let messagingService: jest.Mocked<MessagingService>;

  const mockLLMResponse = {
    content: JSON.stringify({
      clinical_assessment: {
        presenting_complaint: 'Test complaint',
        key_findings: ['finding1', 'finding2'],
        clinical_interpretation: 'Test interpretation',
        severity_assessment: {
          level: 'MODERATE',
          reasoning: 'Test reasoning',
          confidence: 0.8,
        },
      },
      differential_diagnosis: {
        primary_diagnosis: {
          condition: 'Test condition',
          likelihood: 0.85,
          supporting_evidence: ['evidence1', 'evidence2'],
          clinical_pearls: ['pearl1', 'pearl2'],
        },
        alternative_diagnoses: [],
      },
      management_plan: {
        immediate_actions: ['action1', 'action2'],
        investigations: {
          required: ['test1', 'test2'],
          optional: [],
          rationale: 'Test rationale',
        },
        treatment_recommendations: {
          first_line: ['treatment1'],
          alternatives: [],
          monitoring_parameters: ['param1'],
        },
        referral_recommendations: {
          urgency: 'ROUTINE',
          specialty: 'Test specialty',
          rationale: 'Test rationale',
        },
      },
      patient_safety: {
        red_flags: ['flag1'],
        warning_signs: ['sign1'],
        follow_up_plan: {
          timing: 'Test timing',
          key_review_points: ['point1'],
        },
      },
      evidence_base: {
        guidelines_referenced: ['guideline1'],
        key_evidence_points: ['evidence1'],
        certainty_level: 'MODERATE',
      },
    }),
    tokenUsage: 500,
    provider: 'medpalm',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIOrchestrationService,
        {
          provide: LLMService,
          useValue: {
            analyzeSymptoms: jest.fn(),
            findTemplate: jest.fn(),
            generateResponse: jest.fn(),
          },
        },
        {
          provide: PrometheusService,
          useValue: {
            incrementProviderError: jest.fn(),
            recordTaskMetrics: jest.fn(),
            recordModelMetrics: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
        {
          provide: MessagingService,
          useValue: {
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AIOrchestrationService>(AIOrchestrationService);
    llmService = module.get(LLMService);
    prometheusService = module.get(PrometheusService);
    loggerService = module.get(LoggerService);
    messagingService = module.get(MessagingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('routeTask', () => {
    const mockInput = {
      symptoms: ['fever', 'cough'],
      duration: '3 days',
    };

    it('should successfully route a symptom analysis task', async () => {
      llmService.analyzeSymptoms.mockResolvedValueOnce(mockLLMResponse);

      const result = await service.routeTask('symptom-analysis', mockInput);

      expect(result).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.providers).toContain('medpalm');
      expect(prometheusService.recordTaskMetrics).toHaveBeenCalled();
    });

    it('should handle provider errors and try alternatives', async () => {
      llmService.analyzeSymptoms
        .mockRejectedValueOnce(new Error('Provider error'))
        .mockResolvedValueOnce(mockLLMResponse);

      const result = await service.routeTask('symptom-analysis', mockInput);

      expect(result).toBeDefined();
      expect(prometheusService.incrementProviderError).toHaveBeenCalled();
      expect(loggerService.error).toHaveBeenCalled();
    });

    it('should respect cost thresholds', async () => {
      const expensiveResponse = {
        ...mockLLMResponse,
        tokenUsage: 100000, // Will result in high cost
      };

      llmService.analyzeSymptoms.mockResolvedValueOnce(expensiveResponse);

      const result = await service.routeTask('symptom-analysis', mockInput);

      expect(result).toBeDefined();
      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('Cost threshold exceeded'),
        expect.any(Object),
      );
    });

    it('should implement voting mechanism with multiple responses', async () => {
      const responses = [
        mockLLMResponse,
        {
          ...mockLLMResponse,
          provider: 'openai',
        },
        {
          ...mockLLMResponse,
          provider: 'anthropic',
        },
      ];

      responses.forEach((response) => {
        llmService.analyzeSymptoms.mockResolvedValueOnce(response);
      });

      const result = await service.routeTask('symptom-analysis', mockInput);

      expect(result).toBeDefined();
      expect(result.providers.length).toBeGreaterThan(1);
      expect(result.votingScore).toBeDefined();
    });
  });

  describe('confidence calculation', () => {
    it('should calculate confidence based on response structure', async () => {
      llmService.analyzeSymptoms.mockResolvedValueOnce(mockLLMResponse);

      const result = await service.routeTask('symptom-analysis', {});

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle malformed responses', async () => {
      const malformedResponse = {
        ...mockLLMResponse,
        content: 'invalid json',
      };

      llmService.analyzeSymptoms.mockResolvedValueOnce(malformedResponse);

      const result = await service.routeTask('symptom-analysis', {});

      expect(result.confidence).toBe(0);
      expect(loggerService.error).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should throw error when no routing configuration exists', async () => {
      await expect(service.routeTask('invalid-task', {})).rejects.toThrow(
        'No routing configuration found',
      );
    });

    it('should throw error when no providers are available', async () => {
      llmService.analyzeSymptoms.mockRejectedValue(new Error('Provider error'));

      await expect(service.routeTask('symptom-analysis', {})).rejects.toThrow(
        'No successful responses',
      );
    });
  });

  describe('cost optimization', () => {
    it('should track cost per query', async () => {
      llmService.analyzeSymptoms.mockResolvedValueOnce(mockLLMResponse);

      await service.routeTask('symptom-analysis', {});

      expect(prometheusService.recordModelMetrics).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          cost: expect.any(Number),
        }),
      );
    });

    it('should prefer cost-effective providers', async () => {
      const responses = [
        { ...mockLLMResponse, tokenUsage: 1000 }, // More expensive
        { ...mockLLMResponse, tokenUsage: 500 }, // Less expensive
      ];

      responses.forEach((response) => {
        llmService.analyzeSymptoms.mockResolvedValueOnce(response);
      });

      const result = await service.routeTask('symptom-analysis', {});

      expect(result.totalCost).toBeLessThanOrEqual(
        responses[0].tokenUsage * 0.00002, // Using OpenAI's rate
      );
    });
  });
}); 