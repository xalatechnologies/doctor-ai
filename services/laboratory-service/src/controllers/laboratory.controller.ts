import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { LaboratoryService, LabResult } from '../services/laboratory.service';

@ApiTags('Laboratory')
@Controller('laboratory')
export class LaboratoryController {
  constructor(private readonly laboratoryService: LaboratoryService) {}

  @Get(':patientId')
  @ApiOperation({ summary: 'Get lab results for a patient' })
  @ApiParam({ name: 'patientId', type: String, description: 'Patient ID' })
  @ApiResponse({ status: 200, description: 'Returns lab results for the patient', type: Array })
  getLabResults(@Param('patientId') patientId: string): Promise<LabResult[]> {
    return this.laboratoryService.getLabResults(patientId);
  }

  @Post(':patientId')
  @ApiOperation({ summary: 'Create a new lab result' })
  @ApiParam({ name: 'patientId', type: String, description: 'Patient ID' })
  @ApiBody({ type: Object, description: 'Lab result data' })
  @ApiResponse({ status: 201, description: 'Lab result created successfully', type: Object })
  createLabResult(
    @Param('patientId') patientId: string,
    @Body() result: LabResult
  ): Promise<LabResult> {
    return this.laboratoryService.createLabResult(patientId, result);
  }
} 