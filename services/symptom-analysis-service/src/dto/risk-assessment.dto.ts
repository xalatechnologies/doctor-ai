import { ApiProperty } from '@nestjs/swagger';
import { RiskAssessmentResponse } from '@app/common';

export class RiskAssessmentResponseDto implements RiskAssessmentResponse {
  @ApiProperty({
    description: 'Risk level assessment',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
  })
  riskLevel!: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiProperty({
    description: 'Medical recommendations based on the assessment',
    type: [String],
  })
  recommendations!: string[];

  @ApiProperty({
    description: 'Urgency level of the situation',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
  })
  urgencyLevel!: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiProperty({
    description: 'Whether follow-up is required',
    type: Boolean,
  })
  followUpRequired!: boolean;

  @ApiProperty({
    description: 'Timestamp of the assessment',
    type: String,
    format: 'date-time',
  })
  timestamp!: string;
} 