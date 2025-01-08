import { Test, TestingModule } from '@nestjs/testing';
import { AIOrchestrationService, TaskInput, ModelResponse, AggregatedResult } from './ai-orchestration.service';
import { LLMService } from '../../common/llm/llm.service';
import { PrometheusService } from '../../common/monitoring/prometheus.service';
import { LoggerService } from '../../common/logger/logger.service';
import { MessagingService } from '../../common/messaging/messaging.service';
import { ProviderName } from '../../common/llm/errors/error-utils';

describe('AIOrchestrationService', () => {
  let service: AIOrchestrationService;
  let llmService: jest.Mocked<LLMService>;
  let prometheusService: jest.Mocked<PrometheusService>;
  let loggerService: jest.Mocked<LoggerService>;
  let messagingService: jest.Mocked<MessagingService>;

  const mockModelResponse: ModelResponse = {
    content: JSON.stringify({
      clinical_assessment: {
        symptoms: ['headache', 'fever'],
        severity: 'moderate',
      },
      differential_diagnosis: {
        primary: 'migraine',
        alternatives: ['tension headache', 'sinusitis'],
      },
      management_plan: {
        immediate: ['rest', 'hydration'],
        medications: ['acetaminophen'],
      },
      patient_safety: {
        red_flags: [],
        follow_up: '48 hours',
      },
      evidence_base: {
        guidelines_referenced: ['IHS Guidelines 2021'],
        key_evidence_points: ['Meta-analysis of treatment options'],
      },
    }),
    confidence: 0.85,
    provider: 'google-medpalm' as ProviderName,
    responseTime: 1.2,
    cost: 0.05,
  };

  beforeEach(async () => {
    const mockLLMService = {
      generateResponse: jest.fn().mockResolvedValue({
        content: mockModelResponse.content,
        tokenUsage: 500,
        provider: 'google-medpalm',
      }),
    };

    const mockPrometheusService = {
      recordTaskMetrics: jest.fn(),
      recordModelMetrics: jest.fn(),
      incrementProviderError: jest.fn(),
    };

    const mockLoggerService = {
      error: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const mockMessagingService = {
      publishEvent: jest.fn(),
      subscribeToEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIOrchestrationService,
        {
          provide: LLMService,
          useValue: mockLLMService,
        },
        {
          provide: PrometheusService,
          useValue: mockPrometheusService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
        {
          provide: MessagingService,
          useValue: mockMessagingService,
        },
      ],
    }).compile();

    service = module.get<AIOrchestrationService>(AIOrchestrationService);
    llmService = module.get(LLMService);
    prometheusService = module.get(PrometheusService);
    loggerService = module.get(LoggerService);
    messagingService = module.get(MessagingService);
  });

  describe('routeTask', () => {
    it('should successfully route a symptom analysis task', async () => {
      const symptoms = ['headache', 'fever'];
      const input: TaskInput = {
        prompt: 'Analyze symptoms: headache and fever',
        symptoms,
        duration: '24 hours',
      };

      // Mock multiple provider responses
      llmService.generateResponse
        .mockResolvedValueOnce({
          content: mockModelResponse.content,
          tokenUsage: 500,
          provider: 'google-medpalm',
        })
        .mockResolvedValueOnce({
          content: mockModelResponse.content,
          tokenUsage: 450,
          provider: 'anthropic',
        })
        .mockResolvedValueOnce({
          content: mockModelResponse.content,
          tokenUsage: 480,
          provider: 'openai',
        });

      const result = await service.routeTask('symptom-analysis', input);

      expect(result).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.providers).toContain('google-medpalm');
      expect(prometheusService.recordTaskMetrics).toHaveBeenCalled();
      expect(prometheusService.recordModelMetrics).toHaveBeenCalled();
      expect(loggerService.log).toHaveBeenCalled();
    });

    it('should handle errors during task routing', async () => {
      const symptoms = ['severe headache'];
      const input: TaskInput = {
        prompt: 'Analyze symptoms: severe headache',
        symptoms,
        duration: '2 hours',
      };

      llmService.generateResponse.mockRejectedValue(new Error('Failed to analyze symptoms'));

      await expect(service.routeTask('symptom-analysis', input))
        .rejects.toThrow('Failed to analyze symptoms');
      expect(loggerService.error).toHaveBeenCalled();
      expect(prometheusService.incrementProviderError).toHaveBeenCalled();
    });

    it('should handle invalid task types', async () => {
      const input: TaskInput = {
        prompt: 'Invalid task',
      };

      await expect(service.routeTask('invalid-task', input))
        .rejects.toThrow('No routing configuration found for task type: invalid-task');
    });

    it('should respect cost thresholds', async () => {
      const input: TaskInput = {
        prompt: 'Analyze symptoms',
        symptoms: ['headache'],
      };

      // Mock expensive responses
      llmService.generateResponse
        .mockResolvedValueOnce({
          content: mockModelResponse.content,
          tokenUsage: 2000, // High token usage = high cost
          provider: 'google-medpalm',
        });

      const result = await service.routeTask('symptom-analysis', input);
      expect(result).toBeDefined();
      expect(result.totalCost).toBeLessThanOrEqual(0.1); // maxCost from taskRoutingMap
    });

    it('should implement voting when multiple responses are available', async () => {
      const input: TaskInput = {
        prompt: 'Analyze symptoms',
        symptoms: ['fever'],
      };

      // Mock similar responses for voting
      const response1 = { ...mockModelResponse, provider: 'google-medpalm' as ProviderName };
      const response2 = { ...mockModelResponse, provider: 'anthropic' as ProviderName };
      const response3 = { ...mockModelResponse, provider: 'openai' as ProviderName };

      llmService.generateResponse
        .mockResolvedValueOnce({
          content: response1.content,
          tokenUsage: 500,
          provider: response1.provider,
        })
        .mockResolvedValueOnce({
          content: response2.content,
          tokenUsage: 500,
          provider: response2.provider,
        })
        .mockResolvedValueOnce({
          content: response3.content,
          tokenUsage: 500,
          provider: response3.provider,
        });

      const result = await service.routeTask('symptom-analysis', input);
      expect(result).toBeDefined();
      expect(result.providers.length).toBeGreaterThan(1);
      expect(result.votingScore).toBeDefined();
      expect(result.votingScore).toBeGreaterThan(0);
    });
  });
}); 