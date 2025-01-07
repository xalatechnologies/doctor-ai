import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmergencyService } from './services/emergency.service';
import { EmergencyController } from './controllers/emergency.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [EmergencyController],
  providers: [EmergencyService],
  exports: [EmergencyService],
})
export class EmergencyModule {} 