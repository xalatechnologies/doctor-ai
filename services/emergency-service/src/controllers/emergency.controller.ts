import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmergencyService } from '@services/emergency.service';
import { AssessEmergencyDto } from '@dto/assess-emergency.dto';
import { EmergencyAssessment } from '@interfaces/emergency.interface';
import { MessagePattern, Payload } from '@nestjs/microservices';

@ApiTags('emergency')
@Controller('emergency')
export class EmergencyController {
  private readonly logger = new Logger(EmergencyController.name);

  constructor(private readonly emergencyService: EmergencyService) {}

  @Post('assess')
  @ApiOperation({ summary: 'Assess an emergency situation' })
  @ApiResponse({
    status: 201,
    description: 'Emergency assessment completed successfully',
    type: EmergencyAssessment,
  })
  @ApiResponse({ status: 400, description: 'Invalid emergency data provided' })
  @ApiResponse({ status: 500, description: 'Internal server error during assessment' })
  async assessEmergency(@Body() data: AssessEmergencyDto): Promise<EmergencyAssessment> {
    this.logger.log(`Received emergency assessment request: ${JSON.stringify(data)}`);
    return this.emergencyService.assessEmergency(data);
  }

  @MessagePattern('emergency.assess')
  async handleEmergencyAssessment(@Payload() data: AssessEmergencyDto): Promise<EmergencyAssessment> {
    this.logger.log(`Received emergency assessment message: ${JSON.stringify(data)}`);
    return this.emergencyService.assessEmergency(data);
  }

  @MessagePattern('emergency.treatment.plan')
  async handleTreatmentPlan(
    @Payload() data: {
      treatmentPlan: {
        category: string;
        priority: 'HIGH' | 'MEDIUM' | 'LOW';
        immediateActions: string[];
      };
      patientData: {
        medications?: string[];
      };
    },
  ): Promise<void> {
    this.logger.log(`Received treatment plan for emergency: ${JSON.stringify(data)}`);
    return this.emergencyService.handleTreatmentPlan(data);
  }
} 