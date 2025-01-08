import { ApiProperty } from '@nestjs/swagger';
import { RiskAssessmentResponse } from '@app/common';
import { RiskLevel, UrgencyLevel } from '../interfaces/risk-assessment-response.interface';

export class RiskAssessmentResponseDto implements RiskAssessmentResponse {
  @ApiProperty({
    enum: RiskLevel,
    example: RiskLevel.MEDIUM,
    description: 'Assessed risk level',
  })
  riskLevel!: RiskLevel;

  @ApiProperty({
    example: 0.85,
    description: 'Confidence level in the risk assessment',
  })
  confidence!: number;

  @ApiProperty({
    example: 'Based on symptom severity and vital signs',
    description: 'Explanation of the risk assessment',
  })
  explanation!: string;

  @ApiProperty({
    example: ['Seek immediate medical attention', 'Monitor vital signs'],
    description: 'Recommended actions based on risk level',
  })
  recommendations!: string[];

  @ApiProperty({
    enum: UrgencyLevel,
    example: UrgencyLevel.SOON,
    description: 'Urgency level for medical attention',
  })
  urgencyLevel!: UrgencyLevel;

  @ApiProperty({
    example: true,
    description: 'Whether follow-up is required',
  })
  followUpRequired!: boolean;
} 