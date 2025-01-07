import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TreatmentService } from './services/treatment.service';
import { TreatmentController } from './controllers/treatment.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [TreatmentController],
  providers: [TreatmentService],
  exports: [TreatmentService],
})
export class TreatmentModule {} 