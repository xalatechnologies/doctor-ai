import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SymptomAnalysisModule } from './symptom-analysis.module';
import { CommonModule } from '@app/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SymptomAnalysisModule,
    CommonModule,
  ],
})
export class AppModule {} 