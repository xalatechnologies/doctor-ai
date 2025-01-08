import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly clientProxy: ClientProxy) {}

  getClient(): ClientProxy {
    return this.clientProxy;
  }

  async onModuleInit(): Promise<void> {
    await this.clientProxy.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.clientProxy.close();
  }

  async send<TInput = any, TResult = any>(pattern: string, data: TInput): Promise<TResult> {
    try {
      return await this.clientProxy.send(pattern, data).toPromise();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to send message: ${message}`);
    }
  }

  async emit<T>(pattern: string, data: T): Promise<void> {
    try {
      await this.clientProxy.emit(pattern, data).toPromise();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to emit message: ${message}`);
    }
  }
}
