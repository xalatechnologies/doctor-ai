import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmergencyService } from './services/emergency.service';
import { EmergencyController } from './controllers/emergency.controller';
import { LoggerModule } from '@app/common/logger';
import { MessagingModule } from '@app/common/messaging';
import { LLMModule } from '@app/common/llm';
import { MetricsModule } from '@app/common/metrics';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    MessagingModule,
    LLMModule,
    MetricsModule,
  ],
  controllers: [EmergencyController],
  providers: [EmergencyService],
  exports: [EmergencyService],
})
export class EmergencyModule {} 