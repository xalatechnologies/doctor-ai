import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from './logger.service';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from '../metrics/metrics.service';

describe('LoggerService', () => {
  let service: LoggerService;
  let configService: ConfigService;
  let metricsService: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              switch (key) {
                case 'NODE_ENV':
                  return 'test';
                case 'LOG_LEVEL':
                  return 'debug';
                case 'LOG_DIR':
                  return 'logs';
                default:
                  return undefined;
              }
            }),
          },
        },
        {
          provide: MetricsService,
          useValue: {
            recordLatency: jest.fn(),
            logError: jest.fn(),
            incrementLLMTokens: jest.fn(),
            incrementLLMError: jest.fn(),
            observeLLMDuration: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
    configService = module.get<ConfigService>(ConfigService);
    metricsService = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log levels', () => {
    it('should log at different levels', () => {
      service.log('info message');
      service.debug('debug message');
      service.warn('warning message');
      service.error('error message');
      service.verbose('verbose message');

      expect(metricsService.incrementLLMTokens).toHaveBeenCalledTimes(4);
      expect(metricsService.incrementLLMError).toHaveBeenCalledTimes(1);
    });
  });

  describe('error logging', () => {
    it('should log errors with stack traces', () => {
      const error = new Error('Test error');
      service.error('error occurred', error.stack);

      expect(metricsService.incrementLLMError).toHaveBeenCalledWith(
        'logger',
        'logger',
        'error',
      );
    });
  });

  describe('context handling', () => {
    it('should include context in log messages', () => {
      const context = 'TestContext';
      service.log('test message', context);

      expect(metricsService.incrementLLMTokens).toHaveBeenCalledWith(
        'logger',
        'logger',
        'prompt',
        1,
      );
    });
  });
});
