import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebClient } from '@slack/web-api';
import * as nodemailer from 'nodemailer';
import { PushNotificationService } from './push-notification.service';

export interface NotificationConfig {
  slack?: {
    enabled: boolean;
    token: string;
    channel: string;
  };
  email?: {
    enabled: boolean;
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    from: string;
    recipients: string[];
  };
  pushNotifications?: {
    enabled: boolean;
    topics: string[];
  };
}

export type NotificationSeverity = 'info' | 'warning' | 'critical';

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);
  private readonly config: NotificationConfig;
  private slackClient: WebClient;
  private emailTransporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    private readonly pushNotificationService: PushNotificationService,
  ) {
    this.config = {
      slack: {
        enabled: this.configService.get<boolean>('SLACK_ENABLED') || false,
        token: this.configService.get<string>('SLACK_TOKEN') || '',
        channel: this.configService.get<string>('SLACK_CHANNEL') || '',
      },
      email: {
        enabled: this.configService.get<boolean>('EMAIL_ENABLED') || false,
        host: this.configService.get<string>('EMAIL_HOST') || '',
        port: this.configService.get<number>('EMAIL_PORT') || 587,
        secure: this.configService.get<boolean>('EMAIL_SECURE') || false,
        auth: {
          user: this.configService.get<string>('EMAIL_USER') || '',
          pass: this.configService.get<string>('EMAIL_PASS') || '',
        },
        from: this.configService.get<string>('EMAIL_FROM') || '',
        recipients: this.configService.get<string>('EMAIL_RECIPIENTS')?.split(',') || [],
      },
      pushNotifications: {
        enabled: this.configService.get<boolean>('PUSH_NOTIFICATIONS_ENABLED') || false,
        topics: this.configService.get<string>('PUSH_NOTIFICATION_TOPICS')?.split(',') || [],
      },
    };
  }

  async onModuleInit(): Promise<void> {
    if (this.config.slack?.enabled) {
      this.initializeSlackClient();
    }
    if (this.config.email?.enabled) {
      this.initializeEmailTransporter();
    }
  }

  async sendNotification(
    message: string,
    severity: NotificationSeverity,
    metadata?: Record<string, unknown>,
    channel?: string,
  ): Promise<void> {
    try {
      const promises: Promise<void>[] = [];
      if (this.config.slack?.enabled && (!channel || channel === 'slack')) {
        promises.push(this.sendSlackNotification(message, severity, metadata));
      }
      if (this.config.email?.enabled && (!channel || channel === 'email')) {
        promises.push(this.sendEmailNotification(message, severity, metadata));
      }
      if (this.config.pushNotifications?.enabled && (!channel || channel === 'push')) {
        promises.push(this.sendPushNotification(message, severity, metadata));
      }
      await Promise.all(promises);
    } catch (error) {
      this.logger.error('Failed to send notification:', error);
      throw error;
    }
  }

  private initializeSlackClient(): void {
    if (!this.config.slack?.token) {
      throw new Error('Slack token is required when Slack notifications are enabled');
    }
    this.slackClient = new WebClient(this.config.slack.token);
  }

  private initializeEmailTransporter(): void {
    if (!this.config.email?.host || !this.config.email.auth.user) {
      throw new Error('Email configuration is incomplete');
    }
    this.emailTransporter = nodemailer.createTransport({
      host: this.config.email.host,
      port: this.config.email.port,
      secure: this.config.email.secure,
      auth: this.config.email.auth,
    });
  }

  private async sendSlackNotification(
    message: string,
    severity: NotificationSeverity,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      if (!this.config.slack?.channel) {
        throw new Error('Slack channel is not configured');
      }
      const color = this.getSeverityColor(severity);
      await this.slackClient.chat.postMessage({
        channel: this.config.slack.channel,
        attachments: [
          {
            color,
            text: message,
            fields: metadata
              ? Object.entries(metadata).map(([key, value]) => ({
                  title: key,
                  value: String(value),
                  short: true,
                }))
              : [],
          },
        ],
      });
    } catch (error) {
      this.logger.error('Failed to send Slack notification:', error);
      throw error;
    }
  }

  private async sendEmailNotification(
    message: string,
    severity: NotificationSeverity,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      if (!this.config.email?.from || !this.config.email?.recipients.length) {
        throw new Error('Email configuration is incomplete');
      }
      const subject = `[${severity.toUpperCase()}] Medical AI System Alert`;
      const html = this.generateEmailTemplate(message, severity, metadata);
      await this.emailTransporter.sendMail({
        from: this.config.email.from,
        to: this.config.email.recipients,
        subject,
        html,
      });
    } catch (error) {
      this.logger.error('Failed to send email notification:', error);
      throw error;
    }
  }

  private async sendPushNotification(
    message: string,
    severity: NotificationSeverity,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      if (!this.config.pushNotifications?.topics.length) {
        throw new Error('Push notification topics are not configured');
      }
      await this.pushNotificationService.sendToTopics(
        this.config.pushNotifications.topics,
        {
          title: `[${severity.toUpperCase()}] Alert`,
          body: message,
          data: metadata,
        },
      );
    } catch (error) {
      this.logger.error('Failed to send push notification:', error);
      throw error;
    }
  }

  private getSeverityColor(severity: NotificationSeverity): string {
    const colors: Record<NotificationSeverity, string> = {
      info: '#2196F3',
      warning: '#FFC107',
      critical: '#F44336',
    };
    return colors[severity];
  }

  private generateEmailTemplate(
    message: string,
    severity: NotificationSeverity,
    metadata?: Record<string, unknown>,
  ): string {
    // Implementation for generating HTML email template
    return `
      <div style="font-family: Arial, sans-serif;">
        <h2 style="color: ${this.getSeverityColor(severity)}">${message}</h2>
        ${
          metadata
            ? `<div style="margin-top: 20px;">
                ${Object.entries(metadata)
                  .map(
                    ([key, value]) => `
                  <p><strong>${key}:</strong> ${value}</p>
                `,
                  )
                  .join('')}
              </div>`
            : ''
        }
      </div>
    `;
  }
} 