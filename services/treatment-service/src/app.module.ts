import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { TreatmentController } from '@controllers/treatment.controller';
import { TreatmentService } from '@services/treatment.service';
import { HealthController } from '@health/health.controller';
import { RabbitMQModule } from '@rabbitmq/rabbitmq.module';
import configuration from '@config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    TerminusModule,
    RabbitMQModule,
  ],
  controllers: [TreatmentController, HealthController],
  providers: [TreatmentService],
})
export class AppModule {} 