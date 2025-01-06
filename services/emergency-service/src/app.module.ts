import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { EmergencyController } from '@controllers/emergency.controller';
import { EmergencyService } from '@services/emergency.service';
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
  controllers: [EmergencyController, HealthController],
  providers: [EmergencyService],
})
export class AppModule {} 