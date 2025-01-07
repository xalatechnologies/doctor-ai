import { ApiProperty } from '@nestjs/swagger';

export class RiskAssessmentResponseDto {
  @ApiProperty({ description: 'Risk level assessment', enum: ['LOW', 'MEDIUM', 'HIGH'] })
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiProperty({ description: 'Identified risk factors' })
  riskFactors: string[];

  @ApiProperty({ description: 'Immediate recommendations' })
  recommendations: string[];

  @ApiProperty({ description: 'Whether emergency care is needed' })
  requiresEmergencyCare: boolean;

  @ApiProperty({ description: 'Whether specialist referral is recommended' })
  specialistReferral: boolean;
} 