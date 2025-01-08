import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LLMOrchestrationService } from './llm-orchestration.service';

@Module({
  imports: [ConfigModule],
  providers: [LLMOrchestrationService],
  exports: [LLMOrchestrationService],
})
export class LLMModule {}
