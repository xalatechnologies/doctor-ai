import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { PushNotificationService } from './push-notification.service';

@Module({
  imports: [ConfigModule],
  providers: [NotificationService, PushNotificationService],
  exports: [NotificationService],
})
export class NotificationModule {} 