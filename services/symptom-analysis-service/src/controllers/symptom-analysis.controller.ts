import {
  Controller,
  Post,
  Body,
  HttpCode,
  ValidationPipe,
  UsePipes,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SymptomAnalysisService } from '@services/symptom-analysis.service';
import { AnalyzeSymptomDto } from '@dto/analyze-symptom.dto';
import { SymptomAnalysis } from '@interfaces/symptom.interface';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Symptom Analysis')
@Controller('symptom-analysis')
export class SymptomAnalysisController {
  private readonly logger = new Logger(SymptomAnalysisController.name);

  constructor(private readonly symptomAnalysisService: SymptomAnalysisService) {}

  @Post('analyze')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Analyze symptoms and provide recommendations' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The symptom analysis has been successfully created',
    type: SymptomAnalysis,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async analyzeSymptomHttp(@Body() analyzeSymptomDto: AnalyzeSymptomDto): Promise<SymptomAnalysis> {
    this.logger.log(`Received HTTP request to analyze symptoms: ${analyzeSymptomDto.description}`);
    return this.symptomAnalysisService.analyzeSymptom(analyzeSymptomDto);
  }

  @MessagePattern({ cmd: 'analyze_symptom' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async analyzeSymptom(@Payload() analyzeSymptomDto: AnalyzeSymptomDto): Promise<SymptomAnalysis> {
    this.logger.log(`Received message to analyze symptoms: ${analyzeSymptomDto.description}`);
    return this.symptomAnalysisService.analyzeSymptom(analyzeSymptomDto);
  }

  @MessagePattern({ cmd: 'emergency.assessed' })
  async handleEmergencyAssessment(
    @Payload() data: {
      assessment: {
        category: string;
        severity: 'HIGH' | 'MEDIUM' | 'LOW';
        immediateActions: string[];
      };
      patientData: {
        medications?: string[];
      };
    },
  ): Promise<void> {
    this.logger.log(`Received emergency assessment for category: ${data.assessment.category}`);
    return this.symptomAnalysisService.handleEmergencyAssessment(data);
  }

  @MessagePattern({ cmd: 'symptom.status' })
  async getSymptomAnalysisStatus(): Promise<{ status: string; timestamp: string }> {
    this.logger.debug('Checking symptom analysis service status');
    return {
      status: 'operational',
      timestamp: new Date().toISOString(),
    };
  }
} 