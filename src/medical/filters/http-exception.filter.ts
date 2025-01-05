import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MedicalException } from '../exceptions/medical.exception';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details = null;

    if (exception instanceof MedicalException) {
      status = exception.getStatus();
      const response = exception.getResponse() as any;
      message = response.message;
      details = response.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse() as any;
      message = response.message || response;
    }

    // Log the error
    this.logger.error(`${request.method} ${request.url}`, {
      status,
      message,
      details,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    response.status(status).json({
      status: 'error',
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
} 