import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetricsModule } from './metrics';
import { LLMModule } from './llm';
import { MessagingModule } from './messaging';
import { TranslationModule } from './translation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MetricsModule,
    LLMModule,
    MessagingModule,
    TranslationModule,
  ],
  exports: [
    MetricsModule,
    LLMModule,
    MessagingModule,
    TranslationModule,
  ]
})
export class CommonModule {} 