import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationOptions } from './notification.service';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class EmailService {
  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
  ) {}

  async send(options: NotificationOptions): Promise<string> {
    const startTime = Date.now();
    try {
      // Implementation would use an email service provider
      // This is a placeholder implementation
      console.log('Sending email:', options);

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('email', 'send', duration);

      return 'message-id';
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('email', 'send_error', duration);
      throw error;
    }
  }

  async sendTemplate(options: NotificationOptions): Promise<string> {
    const startTime = Date.now();
    try {
      // Implementation would use an email service provider with templates
      // This is a placeholder implementation
      console.log('Sending template email:', options);

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('email', 'send_template', duration);

      return 'message-id';
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('email', 'send_template_error', duration);
      throw error;
    }
  }
} 