import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { SymptomAnalysisController } from '@controllers/symptom-analysis.controller';
import { SymptomAnalysisService } from '@services/symptom-analysis.service';
import { HealthController } from '@health/health.controller';
import { RabbitMQModule } from '@rabbitmq/rabbitmq.module';
import configuration from '@config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),
    TerminusModule,
    RabbitMQModule,
  ],
  controllers: [SymptomAnalysisController, HealthController],
  providers: [SymptomAnalysisService],
})
export class AppModule {} 