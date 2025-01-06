import { Controller, Post, Body, HttpCode, ValidationPipe, UsePipes } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EmergencyService } from '../services/emergency.service';
import { AssessEmergencyDto } from '../dto/assess-emergency.dto';

@Controller('emergency')
export class EmergencyController {
  constructor(private readonly emergencyService: EmergencyService) {}

  @Post('assess')
  @HttpCode(201)
  @UsePipes(new ValidationPipe({ transform: true }))
  async assessEmergencyHttp(@Body() assessEmergencyDto: AssessEmergencyDto) {
    return this.emergencyService.assessEmergency(assessEmergencyDto);
  }

  @MessagePattern({ cmd: 'assess_emergency' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async assessEmergency(@Payload() assessEmergencyDto: AssessEmergencyDto) {
    return this.emergencyService.assessEmergency(assessEmergencyDto);
  }

  @MessagePattern({ cmd: 'emergency.status' })
  async getEmergencyStatus() {
    return {
      status: 'operational',
      timestamp: new Date().toISOString(),
    };
  }
} 