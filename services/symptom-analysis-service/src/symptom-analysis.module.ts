import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SymptomAnalysisController } from './controllers/symptom-analysis.controller';
import { SymptomAnalysisService } from './services/symptom-analysis.service';
import { LLMOrchestrationService } from './services/llm-orchestration.service';
import { MetricsService } from './services/metrics.service';
import { TranslationService } from './services/translation.service';
import { MedicalTerminologyService } from './services/medical-terminology.service';
import { EncryptionService } from './services/encryption.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'medical_analysis_queue',
          queueOptions: {
            durable: true
          }
        }
      }
    ])
  ],
  controllers: [SymptomAnalysisController],
  providers: [
    SymptomAnalysisService,
    LLMOrchestrationService,
    MetricsService,
    TranslationService,
    MedicalTerminologyService,
    EncryptionService,
    {
      provide: 'MEDICAL_TERMINOLOGY',
      useClass: MedicalTerminologyService
    }
  ],
  exports: [SymptomAnalysisService]
})
export class SymptomAnalysisModule {} 