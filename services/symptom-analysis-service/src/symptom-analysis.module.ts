import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SymptomAnalysisController } from './controllers/symptom-analysis.controller';
import { SymptomAnalysisService } from './services/symptom-analysis.service';
import { LLMOrchestrationService } from './services/llm-orchestration.service';
import { MetricsService } from './services/metrics.service';
import { TranslationService } from './services/translation.service';
import { MedicalTerminologyService } from './services/medical-terminology.service';
import { EncryptionService } from './services/encryption.service';
import { CacheService } from './services/cache.service';
import { AuditLoggerMiddleware } from './middleware/audit-logger.middleware';
import { AccessControlMiddleware } from './middleware/access-control.middleware';

@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' }
    }),
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
    CacheService,
    {
      provide: 'MEDICAL_TERMINOLOGY',
      useClass: MedicalTerminologyService
    }
  ],
  exports: [SymptomAnalysisService]
})
export class SymptomAnalysisModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuditLoggerMiddleware, AccessControlMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.GET },
        { path: 'metrics', method: RequestMethod.GET }
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
} 