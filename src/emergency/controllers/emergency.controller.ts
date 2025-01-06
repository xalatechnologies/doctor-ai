import { Controller, Post, Body } from '@nestjs/common';
import { AssessEmergencyDto } from '../dto/assess-emergency.dto';
import { EmergencyService } from '../services/emergency.service';

/**
 * Controller for emergency-related endpoints.
 */
@Controller('emergency')
export class EmergencyController {
  constructor(private readonly emergencyService: EmergencyService) {}

  /**
   * Endpoint to assess an emergency situation.
   * @param assessEmergencyDto DTO containing assessment data.
   */
  @Post('assess')
  async assessEmergency(
    @Body() assessEmergencyDto: AssessEmergencyDto,
  ): Promise<any> {
    return this.emergencyService.assessEmergency(assessEmergencyDto);
  }
} 