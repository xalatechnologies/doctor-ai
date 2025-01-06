import { Controller, Post, Body, HttpCode, ValidationPipe, UsePipes } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SymptomAnalysisService } from '@services/symptom-analysis.service';
import { AnalyzeSymptomDto } from '@dto/analyze-symptom.dto';
import { SymptomAnalysis } from '@interfaces/symptom.interface';

@Controller('symptom-analysis')
export class SymptomAnalysisController {
  constructor(private readonly symptomAnalysisService: SymptomAnalysisService) {}

  @Post('analyze')
  @HttpCode(201)
  @UsePipes(new ValidationPipe({ transform: true }))
  async analyzeSymptomHttp(@Body() analyzeSymptomDto: AnalyzeSymptomDto): Promise<SymptomAnalysis> {
    return this.symptomAnalysisService.analyzeSymptom(analyzeSymptomDto);
  }

  @MessagePattern({ cmd: 'analyze_symptom' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async analyzeSymptom(@Payload() analyzeSymptomDto: AnalyzeSymptomDto): Promise<SymptomAnalysis> {
    return this.symptomAnalysisService.analyzeSymptom(analyzeSymptomDto);
  }

  @MessagePattern({ cmd: 'emergency.assessed' })
  async handleEmergencyAssessment(@Payload() data: any): Promise<void> {
    return this.symptomAnalysisService.handleEmergencyAssessment(data);
  }

  @MessagePattern({ cmd: 'symptom.status' })
  async getSymptomAnalysisStatus(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'operational',
      timestamp: new Date().toISOString(),
    };
  }
} 