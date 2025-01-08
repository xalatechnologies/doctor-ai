import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AlertingService } from './alerting.service';
import { NotificationModule } from '../notification/notification.module';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [ConfigModule, NotificationModule, LoggerModule],
  providers: [AlertingService],
  exports: [AlertingService],
})
export class AlertingModule {}
