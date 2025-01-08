import { Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class RabbitMQService {
  constructor(private readonly clientProxy: ClientProxy) {}

  async emit<T>(pattern: string, data: T): Promise<void> {
    try {
      await this.clientProxy.emit(pattern, data).toPromise();
    } catch (error) {
      throw new Error(`Failed to emit message: ${error.message}`);
    }
  }
}
