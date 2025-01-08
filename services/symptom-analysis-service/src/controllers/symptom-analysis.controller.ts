import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { SymptomAnalysisService } from '../services/symptom-analysis.service';
import { SymptomRiskInput, RiskAssessmentResponse, MedicalReport } from '../interfaces/common';
import { RiskAssessmentResponseDto } from '../dto/risk-assessment.dto';
import { MedicalReportDto } from '../dto/medical-report.dto';

@ApiTags('symptom-analysis')
@Controller('symptom-analysis')
export class SymptomAnalysisController {
  constructor(private readonly symptomAnalysisService: SymptomAnalysisService) {}

  @Post('assess-risk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assess symptom risks',
    description: 'Analyzes symptoms and provides a risk assessment with recommendations',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Risk assessment completed successfully',
    type: RiskAssessmentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @UsePipes(new ValidationPipe())
  async assessRisk(@Body() input: SymptomRiskInput): Promise<RiskAssessmentResponse> {
    return this.symptomAnalysisService.assessRisk(input);
  }

  @Post(':analysisId/generate-report')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate a medical report',
    description: 'Generates a comprehensive medical report based on symptoms, vital signs, and patient information',
  })
  @ApiParam({
    name: 'analysisId',
    description: 'ID of the symptom analysis',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Medical report generated successfully',
    type: MedicalReportDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Error generating medical report',
  })
  @UsePipes(new ValidationPipe())
  async generateMedicalReport(
    @Param('analysisId') analysisId: string,
  ): Promise<MedicalReport> {
    return this.symptomAnalysisService.generateReport(analysisId);
  }
} 