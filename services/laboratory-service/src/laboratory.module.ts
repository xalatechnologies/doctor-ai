import { Module } from '@nestjs/common';
import { LaboratoryController } from './controllers/laboratory.controller';
import { LaboratoryService } from './services/laboratory.service';

@Module({
  controllers: [LaboratoryController],
  providers: [LaboratoryService],
  exports: [LaboratoryService],
})
export class LaboratoryModule {} 