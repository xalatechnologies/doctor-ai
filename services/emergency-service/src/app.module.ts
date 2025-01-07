import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MessagingModule } from '../../../src/common/messaging/messaging.module';
import { EmergencyController } from './controllers/emergency.controller';
import { EmergencyService } from './services/emergency.service';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    MessagingModule,
  ],
  controllers: [EmergencyController],
  providers: [EmergencyService],
})
export class AppModule {} 