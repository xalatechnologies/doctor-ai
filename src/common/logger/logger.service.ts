import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import { createLogger, format, transports } from 'winston';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger!: winston.Logger;
  private readonly defaultModel = 'logger';

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
  ) {
    this.initializeLogger();
  }

  private initializeLogger(): void {
    const environment = this.configService.get<string>('NODE_ENV') || 'development';
    const logLevel = this.configService.get<string>('LOG_LEVEL') || 'info';
    const logDir = this.configService.get<string>('LOG_DIR') || 'logs';

    this.logger = createLogger({
      level: logLevel,
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.splat(),
        format.json(),
      ),
      defaultMeta: { environment },
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.printf((info: winston.Logform.TransformableInfo) => {
              const { timestamp, level, message, ...meta } = info;
              return `${timestamp} [${level}]: ${message} ${
                Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
              }`;
            }),
          ),
        }),
      ],
    });

    if (environment === 'production') {
      // Add file transport for production
      this.logger.add(
        new transports.File({
          filename: `${logDir}/error.log`,
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
      );
      this.logger.add(
        new transports.File({
          filename: `${logDir}/combined.log`,
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
      );
    }
  }

  log(message: string, context?: string): void {
    this.metricsService.incrementLLMTokens('logger', this.defaultModel, 'prompt', 1);
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string): void {
    this.metricsService.incrementLLMError('logger', this.defaultModel, 'error');
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string): void {
    this.metricsService.incrementLLMTokens('logger', this.defaultModel, 'prompt', 1);
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string): void {
    this.metricsService.incrementLLMTokens('logger', this.defaultModel, 'prompt', 1);
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string): void {
    this.metricsService.incrementLLMTokens('logger', this.defaultModel, 'prompt', 1);
    this.logger.verbose(message, { context });
  }

  logWithMetadata(level: string, message: string, metadata?: Record<string, unknown>): void {
    this.metricsService.incrementLLMTokens('logger', this.defaultModel, 'prompt', 1);
    this.logger.log(level, message, metadata);
  }

  startTimer(): { end: (operation: string) => number } {
    const start = process.hrtime();
    return {
      end: (operation: string): number => {
        const elapsed = process.hrtime(start);
        const duration = (elapsed[0] * 1e9 + elapsed[1]) / 1e6; // Convert to milliseconds
        this.metricsService.observeLLMDuration('logger', this.defaultModel, duration / 1000); // Convert to seconds
        this.debug(`${operation} completed in ${duration.toFixed(2)}ms`);
        return duration;
      },
    };
  }
}
