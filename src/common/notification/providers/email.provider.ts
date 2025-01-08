import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
}

@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  async connect() {
    this.logger.log('Connected to email service');
  }

  async disconnect() {
    this.logger.log('Disconnected from email service');
  }

  async send(notification: EmailNotification): Promise<void> {
    try {
      this.logger.log(`Sending email to ${notification.to}`);
      this.logger.debug('Email notification:', notification);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to send email: ${message}`, stack);
      throw new Error(`Failed to send email: ${message}`);
    }
  }
}
