import { Controller, Post, Body, ValidationPipe, UseFilters, HttpStatus } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse 
} from '@nestjs/swagger';
import { EmergencyAssessmentService } from '../services/emergency-assessment.service';
import { 
  EmergencyAssessmentRequestDto,
  EmergencyAssessmentResponseDto 
} from '../dto/emergency-assessment.dto';
import { HttpExceptionFilter } from '../filters/http-exception.filter';
import { EmergencyAssessmentException } from '../exceptions/medical.exception';

@ApiTags('Emergency Assessment')
@Controller('emergency')
@UseFilters(HttpExceptionFilter)
export class EmergencyController {
  constructor(private readonly emergencyService: EmergencyAssessmentService) {}

  @Post('assess')
  @ApiOperation({
    summary: 'Assess emergency level based on symptoms and vital signs',
    description: `
      Analyzes the provided symptoms and vital signs to determine the emergency level
      and provides appropriate recommendations and nearby facilities if needed.
      
      Emergency levels:
      - immediate: Requires immediate emergency care
      - urgent: Requires care within 1-2 hours
      - semi-urgent: Requires care within 12-24 hours
      - non-urgent: Can be handled through routine care
    `
  })
  @ApiBody({ type: EmergencyAssessmentRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Emergency assessment completed successfully',
    type: EmergencyAssessmentResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data or validation error'
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error or assessment processing failure'
  })
  async assessEmergency(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    request: EmergencyAssessmentRequestDto
  ): Promise<EmergencyAssessmentResponseDto> {
    try {
      const assessment = await this.emergencyService.assessEmergencyLevel(
        {
          primarySymptoms: request.primarySymptoms,
          associatedSymptoms: [],
          riskFactors: [],
          vitalSigns: request.vitalSigns,
          environmentalFactors: []
        },
        request.vitalSigns
      );

      return {
        status: 'success',
        data: assessment
      };
    } catch (error) {
      throw new EmergencyAssessmentException(error.message);
    }
  }
} 