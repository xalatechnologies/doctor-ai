import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmsNotification {
  to: string;
  message: string;
}

@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  async connect() {
    this.logger.log('Connected to SMS service');
  }

  async disconnect() {
    this.logger.log('Disconnected from SMS service');
  }

  async send(notification: SmsNotification): Promise<void> {
    try {
      this.logger.log(`Sending SMS to ${notification.to}`);
      this.logger.debug('SMS notification:', notification);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to send SMS: ${message}`, stack);
      throw new Error(`Failed to send SMS: ${message}`);
    }
  }
}
