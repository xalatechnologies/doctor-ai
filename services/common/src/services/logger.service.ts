import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor(private readonly configService: ConfigService) {
    const environment = this.configService.get<string>('NODE_ENV', 'development');
    const logLevel = this.configService.get<string>('LOG_LEVEL', 'info');

    this.logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { environment },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });

    // Add file transport in production
    if (environment === 'production') {
      this.logger.add(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      );
      this.logger.add(
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      );
    }
  }

  log(message: string, context?: any) {
    this.logger.info(message, context);
  }

  error(message: string, context?: any) {
    this.logger.error(message, context);
  }

  warn(message: string, context?: any) {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: any) {
    this.logger.debug(message, context);
  }

  verbose(message: string, context?: any) {
    this.logger.verbose(message, context);
  }

  info(message: string, context?: any) {
    this.logger.info(message, context);
  }

  // Additional utility methods
  logWithMetadata(level: string, message: string, metadata: any) {
    this.logger.log(level, message, metadata);
  }

  logRequest(req: any, res: any, duration: number) {
    this.logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip
    });
  }

  logError(error: Error, context?: any) {
    this.logger.error(error.message, {
      ...context,
      stack: error.stack,
      name: error.name
    });
  }

  createChildLogger(context: string): winston.Logger {
    return this.logger.child({ context });
  }
} 