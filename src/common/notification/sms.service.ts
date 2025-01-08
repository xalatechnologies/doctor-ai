import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationOptions } from './notification.service';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class SmsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
  ) {}

  async send(options: NotificationOptions): Promise<string> {
    const startTime = Date.now();
    try {
      // Implementation would use an SMS service provider
      // This is a placeholder implementation
      console.log('Sending SMS:', options);

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('sms', 'send', duration);

      return 'message-id';
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('sms', 'send_error', duration);
      throw error;
    }
  }

  async sendTemplate(options: NotificationOptions): Promise<string> {
    const startTime = Date.now();
    try {
      // Implementation would use an SMS service provider with templates
      // This is a placeholder implementation
      console.log('Sending template SMS:', options);

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('sms', 'send_template', duration);

      return 'message-id';
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordLatency('sms', 'send_template_error', duration);
      throw error;
    }
  }
} 