import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import { createLogger, format, transports } from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor(private configService: ConfigService) {
    this.initializeLogger();
  }

  private initializeLogger() {
    const environment = this.configService.get('NODE_ENV') || 'development';
    const logLevel = this.configService.get('LOG_LEVEL') || 'info';

    this.logger = createLogger({
      level: logLevel,
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
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
            })
          ),
        }),
      ],
    });

    if (environment === 'production') {
      // Add file transport for production
      this.logger.add(
        new transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        })
      );
      this.logger.add(
        new transports.File({
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        })
      );
    }
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Additional utility methods
  logWithMetadata(level: string, message: string, metadata?: any) {
    this.logger.log(level, message, metadata);
  }

  startTimer() {
    const start = process.hrtime();
    return {
      end: (operation: string) => {
        const elapsed = process.hrtime(start);
        const duration = (elapsed[0] * 1e9 + elapsed[1]) / 1e6; // Convert to milliseconds
        this.debug(`${operation} completed in ${duration.toFixed(2)}ms`);
        return duration;
      },
    };
  }
} 