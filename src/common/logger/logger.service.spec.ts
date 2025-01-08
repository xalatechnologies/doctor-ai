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
                case 'LOG_LEVEL':
                  return 'info';
                case 'LOG_FORMAT':
                  return 'json';
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
      const message = 'Test message';
      const context = 'TestContext';

      // Spy on console methods
      const infoSpy = jest.spyOn(console, 'info').mockImplementation();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation();

      // Test different log levels
      service.log(message, context);
      service.warn(message, context);
      service.error(message, context);
      service.debug(message, context);

      expect(infoSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
      expect(debugSpy).toHaveBeenCalled();

      // Clean up
      infoSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
      debugSpy.mockRestore();
    });
  });

  describe('error logging', () => {
    it('should log errors with stack traces', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');

      service.error(error.message, error.stack);

      expect(errorSpy).toHaveBeenCalled();
      expect(metricsService.logError).toHaveBeenCalled();

      errorSpy.mockRestore();
    });
  });

  describe('context handling', () => {
    it('should include context in log messages', () => {
      const infoSpy = jest.spyOn(console, 'info').mockImplementation();
      const context = 'TestContext';
      const message = 'Test message';

      service.log(message, context);

      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining(context),
        expect.stringContaining(message),
      );

      infoSpy.mockRestore();
    });
  });
});
