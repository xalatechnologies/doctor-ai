import { Injectable } from '@nestjs/common';

@Injectable()
export class StorageProvider {
  async onModuleInit() {
    // Initialize storage provider
  }

  async onModuleDestroy() {
    // Clean up connections
  }

  async connect() {
    // Connect to storage service
  }

  async disconnect() {
    // Disconnect from storage service
  }
}
