import { ApiProperty } from '@nestjs/swagger';
import { RiskAssessmentResponse, RiskLevel, UrgencyLevel } from '../interfaces/common';
import { IsString, IsNumber, IsArray, IsBoolean, IsEnum } from 'class-validator';

export class RiskAssessmentResponseDto implements RiskAssessmentResponse {
  @ApiProperty({
    enum: RiskLevel,
    example: RiskLevel.MEDIUM,
    description: 'Assessed risk level',
  })
  @IsEnum(RiskLevel)
  riskLevel!: RiskLevel;

  @ApiProperty({
    example: 0.85,
    description: 'Confidence level in the risk assessment',
  })
  @IsNumber()
  confidence!: number;

  @ApiProperty({
    example: 'Based on symptom severity and vital signs',
    description: 'Explanation of the risk assessment',
  })
  @IsString()
  explanation!: string;

  @ApiProperty({
    example: ['Seek immediate medical attention', 'Monitor vital signs'],
    description: 'Recommended actions based on risk level',
  })
  @IsArray()
  @IsString({ each: true })
  recommendations!: string[];

  @ApiProperty({
    enum: UrgencyLevel,
    example: UrgencyLevel.SOON,
    description: 'Urgency level for medical attention',
  })
  @IsEnum(UrgencyLevel)
  urgencyLevel!: UrgencyLevel;

  @ApiProperty({
    example: true,
    description: 'Whether follow-up is required',
  })
  @IsBoolean()
  followUpRequired!: boolean;
} 