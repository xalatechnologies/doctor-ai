import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MessagingModule } from '../../../src/common/messaging/messaging.module';
import { TreatmentController } from './controllers/treatment.controller';
import { TreatmentService } from './services/treatment.service';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    MessagingModule,
  ],
  controllers: [TreatmentController],
  providers: [TreatmentService],
})
export class AppModule {} 