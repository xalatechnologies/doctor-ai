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
  MedicalHistoryRequestDto, 
  MedicalHistoryResponseDto 
} from '../dto/medical-history.dto';
import { HttpExceptionFilter } from '../filters/http-exception.filter';
import { MedicalHistoryService } from '../services/medical-history.service';

@ApiTags('Medical History')
@Controller('medical/history')
@UseFilters(HttpExceptionFilter)
export class HistoryController {
  constructor(private readonly historyService: MedicalHistoryService) {}

  @Get()
  @ApiOperation({
    summary: 'Get medical history records',
    description: `
      Retrieves medical history records within a specified date range.
      Can be filtered by record type:
      - consultations
      - diagnoses
      - treatments
      - all (default)
      
      Records are returned in reverse chronological order.
    `
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date for history search (ISO format)'
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for history search (ISO format)'
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['consultations', 'diagnoses', 'treatments', 'all'],
    description: 'Type of medical records to retrieve'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Medical history retrieved successfully',
    type: MedicalHistoryResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Invalid request parameters'
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error or history retrieval failure'
  })
  async getMedicalHistory(@Query() query: MedicalHistoryRequestDto) {
    const history = await this.historyService.getHistory(
      query.startDate,
      query.endDate,
      query.type
    );

    return {
      status: 'success',
      data: history
    };
  }
} 