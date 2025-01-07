import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LLMService } from './llm.service';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [ConfigModule, MetricsModule],
  providers: [LLMService],
  exports: [LLMService],
})
export class LLMModule {} 