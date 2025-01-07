import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetricsModule } from '../metrics';
import { LLMOrchestrationService } from './llm-orchestration.service';

@Module({
  imports: [ConfigModule, MetricsModule],
  providers: [LLMOrchestrationService],
  exports: [LLMOrchestrationService]
})
export class LLMModule {} 