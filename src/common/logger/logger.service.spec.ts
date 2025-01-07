import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger.service';
import * as winston from 'winston';

jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    log: jest.fn(),
    add: jest.fn(),
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    splat: jest.fn(),
    json: jest.fn(),
    colorize: jest.fn(),
    printf: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
}));

describe('LoggerService', () => {
  let service: LoggerService;
  let configService: ConfigService;
  let mockLogger: any;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'NODE_ENV':
          return 'test';
        case 'LOG_LEVEL':
          return 'debug';
        default:
          return undefined;
      }
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
    configService = module.get<ConfigService>(ConfigService);
    mockLogger = (winston.createLogger as jest.Mock)();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logging methods', () => {
    it('should call info for log method', () => {
      const message = 'test log';
      const context = 'test context';
      
      service.log(message, context);
      
      expect(mockLogger.info).toHaveBeenCalledWith(message, { context });
    });

    it('should call error for error method', () => {
      const message = 'test error';
      const trace = 'error trace';
      const context = 'test context';
      
      service.error(message, trace, context);
      
      expect(mockLogger.error).toHaveBeenCalledWith(message, { trace, context });
    });

    it('should call warn for warn method', () => {
      const message = 'test warning';
      const context = 'test context';
      
      service.warn(message, context);
      
      expect(mockLogger.warn).toHaveBeenCalledWith(message, { context });
    });

    it('should call debug for debug method', () => {
      const message = 'test debug';
      const context = 'test context';
      
      service.debug(message, context);
      
      expect(mockLogger.debug).toHaveBeenCalledWith(message, { context });
    });

    it('should call verbose for verbose method', () => {
      const message = 'test verbose';
      const context = 'test context';
      
      service.verbose(message, context);
      
      expect(mockLogger.verbose).toHaveBeenCalledWith(message, { context });
    });
  });

  describe('logWithMetadata', () => {
    it('should call log with level, message and metadata', () => {
      const level = 'info';
      const message = 'test message';
      const metadata = { key: 'value' };
      
      service.logWithMetadata(level, message, metadata);
      
      expect(mockLogger.log).toHaveBeenCalledWith(level, message, metadata);
    });
  });

  describe('startTimer', () => {
    it('should measure operation duration', () => {
      const timer = service.startTimer();
      const operation = 'test operation';
      const debugSpy = jest.spyOn(service, 'debug');
      
      // Simulate some time passing
      jest.advanceTimersByTime(1000);
      
      const duration = timer.end(operation);
      
      expect(duration).toBeDefined();
      expect(debugSpy).toHaveBeenCalled();
      expect(debugSpy.mock.calls[0][0]).toMatch(/test operation completed in/);
    });
  });
}); 