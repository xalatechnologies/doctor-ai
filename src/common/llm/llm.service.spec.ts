import { Test, TestingModule } from '@nestjs/testing';
import { LLMService, ILLMResponse, ISymptomData } from './llm.service';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { CohereProvider } from './providers/cohere.provider';
import { GoogleGeminiProvider } from './providers/google-gemini.provider';
import { GoogleMedPalmProvider } from './providers/google-medpalm.provider';
import { RedisLLMCacheService } from './cache/redis-llm-cache.service';
import { MetricsService } from '../metrics/metrics.service';

jest.mock('./providers/openai.provider');
jest.mock('./providers/anthropic.provider');
jest.mock('./providers/cohere.provider');
jest.mock('./providers/google-gemini.provider');
jest.mock('./providers/google-medpalm.provider');
jest.mock('./cache/redis-llm-cache.service');

describe('LLMService', () => {
  let service: LLMService;
  let openaiProvider: jest.Mocked<OpenAIProvider>;
  let metricsService: jest.Mocked<MetricsService>;
  let cacheService: jest.Mocked<RedisLLMCacheService>;

  const mockLLMResponse: ILLMResponse = {
    content: 'Test response',
    tokenUsage: 100,
    provider: 'openai',
  };

  const mockSymptomData: ISymptomData = {
    description: 'Test symptom',
    duration: '2 days',
    onset: 'sudden',
  };

  beforeEach(async () => {
    const mockMetricsService = {
      recordLatency: jest.fn(),
      logError: jest.fn(),
      incrementProviderError: jest.fn(),
      recordTaskMetrics: jest.fn(),
      setConnectionStatus: jest.fn(),
    };

    const mockCacheService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
      getStats: jest.fn().mockResolvedValue({
        totalEntries: 0,
        totalSize: 0,
        oldestEntry: 0,
        newestEntry: 0,
      }),
      cleanup: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LLMService,
        {
          provide: OpenAIProvider,
          useValue: {
            initialize: jest.fn().mockResolvedValue(undefined),
            isAvailable: jest.fn().mockResolvedValue(true),
            generateResponse: jest.fn().mockResolvedValue(mockLLMResponse),
          },
        },
        {
          provide: AnthropicProvider,
          useValue: {
            initialize: jest.fn().mockResolvedValue(undefined),
            isAvailable: jest.fn().mockResolvedValue(false),
            generateResponse: jest.fn(),
          },
        },
        {
          provide: CohereProvider,
          useValue: {
            initialize: jest.fn().mockResolvedValue(undefined),
            isAvailable: jest.fn().mockResolvedValue(false),
            generateResponse: jest.fn(),
          },
        },
        {
          provide: GoogleGeminiProvider,
          useValue: {
            initialize: jest.fn().mockResolvedValue(undefined),
            isAvailable: jest.fn().mockResolvedValue(false),
            generateResponse: jest.fn(),
          },
        },
        {
          provide: GoogleMedPalmProvider,
          useValue: {
            initialize: jest.fn().mockResolvedValue(undefined),
            isAvailable: jest.fn().mockResolvedValue(false),
            generateResponse: jest.fn(),
          },
        },
        {
          provide: RedisLLMCacheService,
          useValue: mockCacheService,
        },
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    service = module.get<LLMService>(LLMService);
    openaiProvider = module.get(OpenAIProvider);
    metricsService = module.get(MetricsService);
    cacheService = module.get(RedisLLMCacheService);

    await service.onModuleInit();
  });

  describe('analyzeSymptoms', () => {
    it('should successfully analyze symptoms', async () => {
      const startTime = Date.now();
      const result = await service.analyzeSymptoms([mockSymptomData]);
      const endTime = Date.now();

      expect(result).toEqual(mockLLMResponse);
      expect(openaiProvider.generateResponse).toHaveBeenCalled();
      expect(metricsService.recordLatency).toHaveBeenCalledWith(
        'llm',
        'analyze_symptoms',
        expect.any(Number),
      );
      expect(metricsService.recordLatency.mock.calls[0][2]).toBeGreaterThanOrEqual(0);
      expect(metricsService.recordLatency.mock.calls[0][2]).toBeLessThanOrEqual(endTime - startTime);
    });

    it('should handle analysis errors', async () => {
      openaiProvider.generateResponse.mockRejectedValueOnce(new Error('Analysis failed'));

      await expect(service.analyzeSymptoms([mockSymptomData])).rejects.toThrow('Analysis failed');
      expect(metricsService.logError).toHaveBeenCalledWith(
        'llm',
        'analysis_error',
      );
      expect(metricsService.incrementProviderError).toHaveBeenCalledWith('openai');
    });
  });

  describe('findTemplate', () => {
    it('should successfully find a template', async () => {
      const startTime = Date.now();
      const result = await service.findTemplate([mockSymptomData]);
      const endTime = Date.now();

      expect(result).toEqual(mockLLMResponse);
      expect(openaiProvider.generateResponse).toHaveBeenCalled();
      expect(metricsService.recordLatency).toHaveBeenCalledWith(
        'llm',
        'find_template',
        expect.any(Number),
      );
      expect(metricsService.recordLatency.mock.calls[0][2]).toBeGreaterThanOrEqual(0);
      expect(metricsService.recordLatency.mock.calls[0][2]).toBeLessThanOrEqual(endTime - startTime);
    });

    it('should handle template search errors', async () => {
      openaiProvider.generateResponse.mockRejectedValueOnce(new Error('Template search failed'));

      await expect(service.findTemplate([mockSymptomData])).rejects.toThrow('Template search failed');
      expect(metricsService.logError).toHaveBeenCalledWith(
        'llm',
        'template_error',
      );
      expect(metricsService.incrementProviderError).toHaveBeenCalledWith('openai');
    });
  });
});

