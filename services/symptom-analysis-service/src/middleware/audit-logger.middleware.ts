import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface AuditLog {
  requestId: string;
  timestamp: string;
  method: string;
  path: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  statusCode?: number;
  responseTime?: number;
  action: string;
  resourceType: string;
  success: boolean;
  errorMessage?: string;
}

@Injectable()
export class AuditLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('AuditLogger');

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = uuidv4();
    const startTime = Date.now();

    // Attach requestId to the request object for correlation
    (req as any).requestId = requestId;

    // Extract resource type from path
    const resourceType = this.extractResourceType(req.path);

    // Create initial audit log
    const auditLog: AuditLog = {
      requestId,
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      userId: (req as any).user?.id,
      ipAddress: this.getClientIp(req),
      userAgent: req.get('user-agent') || 'unknown',
      action: this.determineAction(req.method),
      resourceType,
      success: true
    };

    // Intercept the response
    const originalSend = res.send;
    res.send = function (body: any): Response {
      (res as any).responseBody = body;
      return originalSend.call(this, body);
    };

    // Handle response completion
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      
      // Update audit log with response details
      auditLog.statusCode = res.statusCode;
      auditLog.responseTime = responseTime;
      auditLog.success = res.statusCode < 400;
      
      if (!auditLog.success) {
        try {
          const responseBody = JSON.parse((res as any).responseBody);
          auditLog.errorMessage = responseBody.message || 'Unknown error';
        } catch (e) {
          auditLog.errorMessage = (res as any).responseBody || 'Unknown error';
        }
      }

      // Log the audit entry
      this.logAuditEntry(auditLog);
    });

    next();
  }

  private extractResourceType(path: string): string {
    const parts = path.split('/').filter(Boolean);
    return parts[0] || 'unknown';
  }

  private determineAction(method: string): string {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'READ';
      case 'POST':
        return 'CREATE';
      case 'PUT':
        return 'UPDATE';
      case 'DELETE':
        return 'DELETE';
      case 'PATCH':
        return 'MODIFY';
      default:
        return 'UNKNOWN';
    }
  }

  private getClientIp(req: Request): string {
    return (
      req.ip ||
      req.get('x-forwarded-for') ||
      req.get('x-real-ip') ||
      req.connection.remoteAddress ||
      'unknown'
    );
  }

  private logAuditEntry(auditLog: AuditLog): void {
    // Log to console in development
    this.logger.log(JSON.stringify(auditLog));

    // In production, you might want to:
    // 1. Send to a logging service (e.g., ELK stack)
    // 2. Store in a database
    // 3. Send to a message queue for async processing
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implement production logging strategy
      // For example:
      // this.logToElasticSearch(auditLog);
      // this.saveToDatabase(auditLog);
      // this.publishToQueue(auditLog);
    }
  }
} 