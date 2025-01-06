import { Controller, Post, Body, Param, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TreatmentService } from '@services/treatment.service';
import { CreateTreatmentDto } from '@dto/create-treatment.dto';
import { UpdateTreatmentProgressDto } from '@dto/update-treatment-progress.dto';
import { TreatmentPlanResponseDto, TreatmentProgressResponseDto } from '@dto/treatment-response.dto';

@ApiTags('Treatment')
@Controller('treatment')
export class TreatmentController {
  constructor(private readonly treatmentService: TreatmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new treatment plan' })
  @ApiResponse({
    status: 201,
    description: 'Treatment plan created successfully',
    type: TreatmentPlanResponseDto,
  })
  async createTreatment(@Body() createTreatmentDto: CreateTreatmentDto): Promise<TreatmentPlanResponseDto> {
    return this.treatmentService.createTreatment(createTreatmentDto);
  }

  @Put(':id/progress')
  @ApiOperation({ summary: 'Update treatment progress' })
  @ApiResponse({
    status: 200,
    description: 'Treatment progress updated successfully',
    type: TreatmentProgressResponseDto,
  })
  async updateTreatmentProgress(
    @Param('id') id: string,
    @Body() updateProgressDto: UpdateTreatmentProgressDto,
  ): Promise<TreatmentProgressResponseDto> {
    return this.treatmentService.updateTreatmentProgress(id, updateProgressDto);
  }
} 