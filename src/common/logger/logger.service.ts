import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import { createLogger, format, transports } from 'winston';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
  ) {
    this.initializeLogger();
  }

  private initializeLogger() {
    const environment = this.configService.get('NODE_ENV') || 'development';
    const logLevel = this.configService.get('LOG_LEVEL') || 'info';
    const logDir = this.configService.get('LOG_DIR') || 'logs';

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
            format.printf(({ timestamp, level, message, ...meta }) => {
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

  log(message: string, context?: string) {
    this.metricsService.incrementLogCount('info');
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.metricsService.incrementLogCount('error');
    this.metricsService.logError('logger', 'error_logged');
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.metricsService.incrementLogCount('warn');
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.metricsService.incrementLogCount('debug');
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.metricsService.incrementLogCount('verbose');
    this.logger.verbose(message, { context });
  }

  logWithMetadata(level: string, message: string, metadata?: Record<string, any>) {
    this.metricsService.incrementLogCount(level);
    this.logger.log(level, message, metadata);
  }

  startTimer() {
    const start = process.hrtime();
    return {
      end: (operation: string) => {
        const elapsed = process.hrtime(start);
        const duration = (elapsed[0] * 1e9 + elapsed[1]) / 1e6; // Convert to milliseconds
        this.metricsService.recordLatency('logger', operation, duration / 1000); // Convert to seconds
        this.debug(`${operation} completed in ${duration.toFixed(2)}ms`);
        return duration;
      },
    };
  }
}
