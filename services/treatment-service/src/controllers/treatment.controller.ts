import { Controller, Post, Body, Param, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TreatmentService } from '@services/treatment.service';
import { CreateTreatmentDto } from '@dto/create-treatment.dto';
import { UpdateTreatmentProgressDto } from '@dto/update-treatment-progress.dto';
import { TreatmentPlan, TreatmentProgress } from '@interfaces/treatment.interface';

@ApiTags('Treatment')
@Controller('treatment')
export class TreatmentController {
  constructor(private readonly treatmentService: TreatmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new treatment plan' })
  @ApiResponse({
    status: 201,
    description: 'Treatment plan created successfully',
    type: TreatmentPlan,
  })
  async createTreatment(@Body() createTreatmentDto: CreateTreatmentDto): Promise<TreatmentPlan> {
    return this.treatmentService.createTreatment(createTreatmentDto);
  }

  @Put(':id/progress')
  @ApiOperation({ summary: 'Update treatment progress' })
  @ApiResponse({
    status: 200,
    description: 'Treatment progress updated successfully',
    type: TreatmentProgress,
  })
  async updateTreatmentProgress(
    @Param('id') id: string,
    @Body() updateProgressDto: UpdateTreatmentProgressDto,
  ): Promise<TreatmentProgress> {
    return this.treatmentService.updateTreatmentProgress(id, updateProgressDto);
  }
} 