import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VisualizationService } from './visualization.service';

@Module({
  imports: [ConfigModule],
  providers: [VisualizationService],
  exports: [VisualizationService],
})
export class VisualizationModule {} 