import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LLMService } from './llm.service';
import { MetricsService } from '../metrics/metrics.service';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

jest.mock('openai');
jest.mock('@anthropic-ai/sdk');

describe('LLMService', () => {
  let service: LLMService;
  let configService: ConfigService;
  let metricsService: MetricsService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'OPENAI_API_KEY':
          return 'test-openai-key';
        case 'ANTHROPIC_API_KEY':
          return 'test-anthropic-key';
        case 'OPENAI_MODEL':
          return 'gpt-4';
        case 'ANTHROPIC_MODEL':
          return 'claude-2';
        default:
          return undefined;
      }
    }),
  };

  const mockMetricsService = {
    incrementLogCount: jest.fn(),
    recordLatency: jest.fn(),
    logError: jest.fn(),
  };

  const mockOpenAIResponse = {
    choices: [
      {
        message: {
          content: 'OpenAI response',
        },
      },
    ],
  };

  const mockAnthropicResponse = {
    content: 'Anthropic response',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock OpenAI
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
      () =>
        ({
          chat: {
            completions: {
              create: jest.fn().mockResolvedValue(mockOpenAIResponse),
            },
          },
        } as unknown as OpenAI),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LLMService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    service = module.get<LLMService>(LLMService);
    configService = module.get<ConfigService>(ConfigService);
    metricsService = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateResponse', () => {
    it('should generate response using OpenAI by default', async () => {
      const prompt = 'test prompt';
      const response = await service.generateResponse(prompt);

      expect(response).toBe('OpenAI response');
    });

    it('should generate response using specified provider (Anthropic)', async () => {
      const prompt = 'test prompt';
      const response = await service.generateResponse(prompt, 'anthropic');

      expect(response).toBe('Anthropic response');
    });

    it('should throw error for uninitialized provider', async () => {
      const prompt = 'test prompt';

      await expect(service.generateResponse(prompt, 'cohere')).rejects.toThrow(
        'Provider cohere is not initialized',
      );
    });

    it('should handle OpenAI error gracefully', async () => {
      const mockError = new Error('OpenAI API error');
      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
        () =>
          ({
            chat: {
              completions: {
                create: jest.fn().mockRejectedValue(mockError),
              },
            },
          }) as any,
      );

      await service.onModuleInit(); // Reinitialize with error mock

      await expect(service.generateResponse('test prompt')).rejects.toThrow(
        'OpenAI API error',
      );
    });

    it('should handle Anthropic error gracefully', async () => {
      const mockError = new Error('Anthropic API error');
      (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(
        () =>
          ({
            messages: {
              create: jest.fn().mockRejectedValue(mockError),
            },
          }) as any,
      );

      await service.onModuleInit(); // Reinitialize with error mock

      await expect(
        service.generateResponse('test prompt', 'anthropic'),
      ).rejects.toThrow('Anthropic API error');
    });
  });

  describe('initialization', () => {
    it('should initialize available providers', async () => {
      const response = await service.generateResponse('test');
      expect(response).toBeDefined();
    });

    it('should throw error when no providers are available', async () => {
      const mockEmptyConfigService = {
        get: jest.fn().mockReturnValue(undefined),
      };

      const moduleRef = await Test.createTestingModule({
        providers: [
          LLMService,
          {
            provide: ConfigService,
            useValue: mockEmptyConfigService,
          },
        ],
      }).compile();

      const serviceWithNoProviders = moduleRef.get<LLMService>(LLMService);

      await expect(serviceWithNoProviders.onModuleInit()).rejects.toThrow(
        'No LLM providers were successfully initialized',
      );
    });
  });
});
