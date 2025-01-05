import { 
  Controller, 
  Post, 
  Body, 
  ValidationPipe, 
  UseFilters,
  HttpStatus
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse 
} from '@nestjs/swagger';
import { SymptomAnalysisService } from '../services/symptom-analysis.service';
import { SymptomAnalysisRequestDto } from '../dto/symptom-analysis.dto';
import { SymptomAnalysisResponseDto } from '../dto/symptom-analysis-response.dto';
import { HttpExceptionFilter } from '../filters/http-exception.filter';
import { InvalidSymptomDataException } from '../exceptions/medical.exception';

@ApiTags('Symptom Analysis')
@Controller('symptoms')
@UseFilters(HttpExceptionFilter)
export class SymptomAnalysisController {
  constructor(private readonly symptomAnalysisService: SymptomAnalysisService) {}

  @Post('analyze')
  @ApiOperation({
    summary: 'Analyze symptoms and provide medical assessment',
    description: `
      Performs a comprehensive analysis of provided symptoms, considering:
      - Primary symptoms and their severity
      - Associated symptoms and their relationships
      - Risk factors and their impact
      - Environmental factors
      - Vital signs
      
      Returns potential diagnoses, recommendations, and urgency assessment.
    `
  })
  @ApiBody({ type: SymptomAnalysisRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Symptom analysis completed successfully',
    type: SymptomAnalysisResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data or validation error'
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error or analysis processing failure'
  })
  async analyzeSymptoms(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) 
    request: SymptomAnalysisRequestDto
  ): Promise<SymptomAnalysisResponseDto> {
    try {
      const analysis = await this.symptomAnalysisService.analyzeSymptoms(
        {
          primarySymptoms: request.primarySymptoms,
          associatedSymptoms: request.associatedSymptoms || [],
          riskFactors: request.riskFactors || [],
          vitalSigns: request.vitalSigns,
          environmentalFactors: request.environmentalFactors || []
        },
        {
          age: 0,
          gender: '',
          medicalHistory: [],
          currentMedications: [],
          allergies: [],
          chronicConditions: []
        }
      );

      return {
        status: 'success',
        data: analysis
      };
    } catch (error) {
      throw new InvalidSymptomDataException(error.message);
    }
  }
} 