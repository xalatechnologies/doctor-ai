import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MessagingModule } from '../../../src/common/messaging/messaging.module';
import { SymptomAnalysisController } from './controllers/symptom-analysis.controller';
import { SymptomAnalysisService } from './services/symptom-analysis.service';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    MessagingModule,
  ],
  controllers: [SymptomAnalysisController],
  providers: [SymptomAnalysisService],
})
export class AppModule {} 