import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EmergencyService } from '../services/emergency.service';
import { AssessEmergencyDto } from '../dto/assess-emergency.dto';

@Controller('emergency')
export class EmergencyController {
  constructor(private readonly emergencyService: EmergencyService) {}

  @Post('assess')
  @HttpCode(201)
  async assessEmergencyHttp(@Body() assessEmergencyDto: AssessEmergencyDto) {
    return this.emergencyService.assessEmergency(assessEmergencyDto);
  }

  @MessagePattern({ cmd: 'assess_emergency' })
  async assessEmergency(@Payload() assessEmergencyDto: AssessEmergencyDto) {
    return this.emergencyService.assessEmergency(assessEmergencyDto);
  }
} 