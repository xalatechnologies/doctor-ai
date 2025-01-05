import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebClient } from '@slack/web-api';
import * as nodemailer from 'nodemailer';
import { PushNotificationService } from './push-notification.service';

interface NotificationConfig {
  slack?: {
    enabled: boolean;
    webhook: string;
    channel: string;
  };
  email?: {
    enabled: boolean;
    recipients: string[];
  };
  pushNotifications?: {
    enabled: boolean;
    topics: string[];
  };
}

@Injectable()
export class NotificationService {
  private slackClient: WebClient;
  private emailTransporter: nodemailer.Transporter;
  private config: NotificationConfig;

  constructor(
    private configService: ConfigService,
    private pushNotificationService: PushNotificationService
  ) {
    this.initializeClients();
  }

  private async initializeClients() {
    // Initialize Slack
    if (this.config.slack?.enabled) {
      this.slackClient = new WebClient(this.configService.get('SLACK_TOKEN'));
    }

    // Initialize Email
    if (this.config.email?.enabled) {
      this.emailTransporter = nodemailer.createTransport({
        host: this.configService.get('SMTP_HOST'),
        port: this.configService.get('SMTP_PORT'),
        secure: true,
        auth: {
          user: this.configService.get('SMTP_USER'),
          pass: this.configService.get('SMTP_PASS')
        }
      });
    }
  }

  async sendNotification(
    message: string,
    severity: 'info' | 'warning' | 'critical',
    metadata?: any
  ) {
    const promises: Promise<any>[] = [];

    if (this.config.slack?.enabled) {
      promises.push(this.sendSlackNotification(message, severity, metadata));
    }

    if (this.config.email?.enabled) {
      promises.push(this.sendEmailNotification(message, severity, metadata));
    }

    if (this.config.pushNotifications?.enabled) {
      promises.push(this.sendPushNotification(message, severity, metadata));
    }

    await Promise.allSettled(promises);
  }

  private async sendSlackNotification(
    message: string,
    severity: string,
    metadata?: any
  ) {
    const color = severity === 'critical' ? '#ff0000' : 
                  severity === 'warning' ? '#ffa500' : '#36a64f';

    await this.slackClient.chat.postMessage({
      channel: this.config.slack.channel,
      attachments: [{
        color,
        text: message,
        fields: metadata ? Object.entries(metadata).map(([key, value]) => ({
          title: key,
          value: String(value),
          short: true
        })) : []
      }]
    });
  }

  private async sendEmailNotification(
    message: string,
    severity: string,
    metadata?: any
  ) {
    const subject = `[${severity.toUpperCase()}] Medical AI System Alert`;
    const html = this.generateEmailTemplate(message, severity, metadata);

    await this.emailTransporter.sendMail({
      from: this.configService.get('SMTP_FROM'),
      to: this.config.email.recipients,
      subject,
      html
    });
  }

  private async sendPushNotification(
    message: string,
    severity: string,
    metadata?: any
  ) {
    await this.pushNotificationService.sendToTopics(
      this.config.pushNotifications.topics,
      {
        title: `Medical AI ${severity.toUpperCase()} Alert`,
        body: message,
        data: metadata
      }
    );
  }

  private generateEmailTemplate(
    message: string,
    severity: string,
    metadata?: any
  ): string {
    return `
      <div style="font-family: Arial, sans-serif;">
        <h2 style="color: ${severity === 'critical' ? '#ff0000' : 
                          severity === 'warning' ? '#ffa500' : '#36a64f'}">
          ${severity.toUpperCase()} Alert
        </h2>
        <p style="font-size: 16px;">${message}</p>
        ${metadata ? `
          <div style="background: #f5f5f5; padding: 15px; margin-top: 20px;">
            <h3>Additional Information</h3>
            ${Object.entries(metadata)
              .map(([key, value]) => `
                <p><strong>${key}:</strong> ${value}</p>
              `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }
} 