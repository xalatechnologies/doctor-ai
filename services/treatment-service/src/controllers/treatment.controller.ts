import { Controller, Post, Put, Body, Param, UsePipes, ValidationPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TreatmentService } from '@services/treatment.service';
import { CreateTreatmentPlanDto } from '@dto/create-treatment.dto';
import { UpdateTreatmentPlanDto, UpdateTreatmentProgressDto } from '@dto/update-treatment.dto';
import { TreatmentPlan, TreatmentProgress } from '@interfaces/treatment.interface';

@Controller('treatment')
@UsePipes(new ValidationPipe())
export class TreatmentController {
  constructor(private readonly treatmentService: TreatmentService) {}

  @Post()
  async createTreatmentPlanHttp(@Body() dto: CreateTreatmentPlanDto): Promise<TreatmentPlan> {
    return this.treatmentService.createTreatmentPlan(dto);
  }

  @MessagePattern('treatment.create')
  async createTreatmentPlan(@Payload() dto: CreateTreatmentPlanDto): Promise<TreatmentPlan> {
    return this.treatmentService.createTreatmentPlan(dto);
  }

  @Put(':id')
  async updateTreatmentPlanHttp(
    @Param('id') id: string,
    @Body() dto: UpdateTreatmentPlanDto
  ): Promise<TreatmentPlan> {
    return this.treatmentService.updateTreatmentPlan(id, dto);
  }

  @MessagePattern('treatment.update')
  async updateTreatmentPlan(
    @Payload() data: { id: string; dto: UpdateTreatmentPlanDto }
  ): Promise<TreatmentPlan> {
    return this.treatmentService.updateTreatmentPlan(data.id, data.dto);
  }

  @Put(':id/progress')
  async updateTreatmentProgressHttp(
    @Param('id') id: string,
    @Body() dto: UpdateTreatmentProgressDto
  ): Promise<TreatmentProgress> {
    return this.treatmentService.updateTreatmentProgress(id, dto);
  }

  @MessagePattern('treatment.progress.update')
  async updateTreatmentProgress(
    @Payload() data: { id: string; dto: UpdateTreatmentProgressDto }
  ): Promise<TreatmentProgress> {
    return this.treatmentService.updateTreatmentProgress(data.id, data.dto);
  }

  @MessagePattern('emergency.assessed')
  async handleEmergencyAssessment(
    @Payload() data: { emergencyId: string; assessment: any }
  ): Promise<void> {
    await this.treatmentService.handleEmergencyAssessment(data.emergencyId, data.assessment);
  }
} 