import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailProvider {
  async onModuleInit() {
    // Initialize email provider
  }

  async onModuleDestroy() {
    // Clean up connections
  }

  async connect() {
    // Connect to email service
  }

  async disconnect() {
    // Disconnect from email service
  }
} 