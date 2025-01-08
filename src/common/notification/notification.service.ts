import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';
import { MetricsService } from '../metrics/metrics.service';

export type NotificationSeverity = 'info' | 'warning' | 'critical';

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

export interface Notification {
  id: string;
  message: string;
  severity: NotificationSeverity;
  channel: NotificationChannel;
  metadata?: Record<string, any>;
  status: NotificationStatus;
}

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  attachments?: Array<{
    filename: string;
    content: string;
  }>;
}

export interface SmsNotification {
  to: string;
  message: string;
}

export interface TemplateNotification {
  to: string;
  templateId: string;
  templateData: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
    private readonly emailProvider: EmailProvider,
    private readonly smsProvider: SmsProvider,
  ) {}

  async sendNotification(
    message: string,
    severity: NotificationSeverity,
    metadata: Record<string, any>,
    channel: NotificationChannel,
  ): Promise<void> {
    try {
      this.logger.log(`Sending notification: ${message} via ${channel}`);
      this.metricsService.incrementLogCount(
        `notifications_sent_${severity}_${channel}`,
      );

      switch (channel) {
        case NotificationChannel.EMAIL:
          await this.sendEmailNotification(message, severity, metadata);
          break;
        case NotificationChannel.SMS:
          await this.sendSMSNotification(message, severity, metadata);
          break;
        case NotificationChannel.PUSH:
          await this.sendPushNotification(message, severity, metadata);
          break;
        default:
          throw new Error(`Unsupported notification channel: ${channel}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to send notification: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async scheduleNotification(notification: Notification): Promise<void> {
    try {
      this.logger.log(`Scheduling notification: ${notification.message}`);
      // Implementation for scheduling notifications
      this.metricsService.incrementLogCount('notifications_scheduled');
    } catch (error) {
      this.logger.error(
        `Failed to schedule notification: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async cancelNotification(notification: Notification): Promise<void> {
    try {
      this.logger.log(`Canceling notification: ${notification.id}`);
      // Implementation for canceling notifications
      this.metricsService.incrementLogCount('notifications_canceled');
    } catch (error) {
      this.logger.error(
        `Failed to cancel notification: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getNotificationStatus(
    notification: Notification,
  ): Promise<NotificationStatus> {
    try {
      this.logger.log(`Getting status for notification: ${notification.id}`);
      // Implementation for getting notification status
      return NotificationStatus.SENT;
    } catch (error) {
      this.logger.error(
        `Failed to get notification status: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async sendEmailNotification(
    message: string,
    severity: NotificationSeverity,
    metadata: Record<string, any>,
  ): Promise<void> {
    const notification: EmailNotification = {
      to: metadata.email || this.configService.get('DEFAULT_EMAIL_RECIPIENT'),
      subject: `${severity.toUpperCase()}: ${message}`,
      body: this.formatEmailBody(message, severity, metadata),
      isHtml: true,
    };
    await this.emailProvider.send(notification);
  }

  private async sendSMSNotification(
    message: string,
    severity: NotificationSeverity,
    metadata: Record<string, any>,
  ): Promise<void> {
    const notification: SmsNotification = {
      to: metadata.phone || this.configService.get('DEFAULT_SMS_RECIPIENT'),
      message: this.formatSMSMessage(message, severity),
    };
    await this.smsProvider.send(notification);
  }

  private async sendPushNotification(
    message: string,
    severity: NotificationSeverity,
    metadata: Record<string, any>,
  ): Promise<void> {
    // Implementation for push notifications would go here
    this.logger.warn('Push notifications not implemented yet');
  }

  private formatEmailBody(
    message: string,
    severity: NotificationSeverity,
    metadata: Record<string, any>,
  ): string {
    return `
      <h2>Alert: ${severity.toUpperCase()}</h2>
      <p>${message}</p>
      ${metadata ? `<pre>${JSON.stringify(metadata, null, 2)}</pre>` : ''}
    `;
  }

  private formatSMSMessage(message: string, severity: NotificationSeverity): string {
    return `[${severity.toUpperCase()}] ${message}`;
  }

  async sendEmail(notification: EmailNotification): Promise<NotificationResult> {
    try {
      await this.emailProvider.send(notification);
      return { success: true, messageId: this.generateId() };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  async sendSms(notification: SmsNotification): Promise<NotificationResult> {
    try {
      await this.smsProvider.send(notification);
      return { success: true, messageId: this.generateId() };
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  async sendBulkEmail(
    notifications: EmailNotification[],
  ): Promise<NotificationResult[]> {
    try {
      const results = await Promise.all(
        notifications.map(notification => this.emailProvider.send(notification)),
      );
      return results.map(() => ({ success: true, messageId: this.generateId() }));
    } catch (error) {
      this.logger.error(`Failed to send bulk email: ${error.message}`, error.stack);
      return notifications.map(() => ({ success: false, error: error.message }));
    }
  }

  async sendBulkSms(
    notifications: SmsNotification[],
  ): Promise<NotificationResult[]> {
    try {
      const results = await Promise.all(
        notifications.map(notification => this.smsProvider.send(notification)),
      );
      return results.map(() => ({ success: true, messageId: this.generateId() }));
    } catch (error) {
      this.logger.error(`Failed to send bulk SMS: ${error.message}`, error.stack);
      return notifications.map(() => ({ success: false, error: error.message }));
    }
  }

  async sendTemplateEmail(
    notification: TemplateNotification,
  ): Promise<NotificationResult> {
    try {
      const emailNotification: EmailNotification = {
        to: notification.to,
        subject: this.getTemplateSubject(notification.templateId, notification.templateData),
        body: await this.renderTemplate(notification.templateId, notification.templateData),
        isHtml: true,
      };
      await this.emailProvider.send(emailNotification);
      return { success: true, messageId: this.generateId() };
    } catch (error) {
      this.logger.error(`Failed to send template email: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  async sendTemplateSms(
    notification: TemplateNotification,
  ): Promise<NotificationResult> {
    try {
      const smsNotification: SmsNotification = {
        to: notification.to,
        message: await this.renderTemplate(notification.templateId, notification.templateData),
      };
      await this.smsProvider.send(smsNotification);
      return { success: true, messageId: this.generateId() };
    } catch (error) {
      this.logger.error(`Failed to send template SMS: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async renderTemplate(
    templateId: string,
    data: Record<string, any>,
  ): Promise<string> {
    // Implementation would load and render template
    return `Template ${templateId} with data: ${JSON.stringify(data)}`;
  }

  private getTemplateSubject(
    templateId: string,
    data: Record<string, any>,
  ): string {
    // Implementation would get template subject
    return `Notification: ${templateId}`;
  }
}
