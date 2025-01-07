import { Controller, Post, Body, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SymptomAnalysisService } from '@services/symptom-analysis.service';
import { SymptomRiskInput } from '@dto/symptom-risk-input.dto';
import { RiskAssessmentResponse } from '@interfaces/risk-assessment.interface';

@Controller('symptom-analysis')
@ApiTags('Symptom Analysis')
export class SymptomAnalysisController {
  constructor(private readonly symptomAnalysisService: SymptomAnalysisService) {}

  @Post('risk-assessment')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Perform AI-powered risk assessment' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the risk assessment results',
    type: RiskAssessmentResponse
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data'
  })
  async assessRisk(@Body() input: SymptomRiskInput): Promise<RiskAssessmentResponse> {
    return this.symptomAnalysisService.assessRisk(input);
  }
} 