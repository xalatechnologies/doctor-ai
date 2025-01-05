import { Controller, Get, Query, UseFilters, HttpStatus } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiQuery,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse 
} from '@nestjs/swagger';
import { 
  MedicalRecommendationRequestDto, 
  MedicalRecommendationResponseDto 
} from '../dto/medical-recommendation.dto';
import { HttpExceptionFilter } from '../filters/http-exception.filter';
import { RecommendationService } from '../services/recommendation.service';

@ApiTags('Medical Recommendations')
@Controller('medical/recommendations')
@UseFilters(HttpExceptionFilter)
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get()
  @ApiOperation({
    summary: 'Get medical recommendations based on condition',
    description: `
      Retrieves medical recommendations for a specific condition, with optional filtering by:
      - Type (lifestyle, medication, followup, prevention)
      - Age group
      
      Recommendations are prioritized and include detailed instructions and timeframes.
    `
  })
  @ApiQuery({
    name: 'condition',
    required: true,
    description: 'Medical condition to get recommendations for'
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['lifestyle', 'medication', 'followup', 'prevention'],
    description: 'Type of recommendations to filter'
  })
  @ApiQuery({
    name: 'ageGroup',
    required: false,
    description: 'Age group for specific recommendations'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recommendations retrieved successfully',
    type: MedicalRecommendationResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Invalid request parameters'
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error or recommendation retrieval failure'
  })
  async getRecommendations(@Query() query: MedicalRecommendationRequestDto): Promise<MedicalRecommendationResponseDto> {
    const recommendations = await this.recommendationService.getRecommendations(
      query.condition,
      query.type,
      query.ageGroup
    );

    return {
      status: 'success',
      data: recommendations
    };
  }
} 