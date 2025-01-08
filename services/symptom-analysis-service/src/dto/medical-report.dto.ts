import { ApiProperty } from '@nestjs/swagger';
import { MedicalReport, VitalSignsDto } from '@app/common';
import { RiskLevel, UrgencyLevel } from '../interfaces/risk-assessment-response.interface';

export class MedicalReportDto implements MedicalReport {
  @ApiProperty()
  reportId!: string;

  @ApiProperty()
  timestamp!: Date;

  @ApiProperty()
  patientId!: string;

  @ApiProperty({ type: [Object] })
  symptoms!: {
    onset: string;
    name: string;
    description: string;
    severity: number;
    duration: string;
    location?: string;
    characteristics?: string[];
  }[];

  @ApiProperty({ type: () => Object })
  vitalSigns!: VitalSignsDto;

  @ApiProperty()
  diagnosis!: string;

  @ApiProperty({ example: ['Take medication as prescribed', 'Rest in dark room'] })
  recommendations!: string[];

  @ApiProperty({ type: () => Object })
  followUpPlan!: {
    timing: string;
    instructions: string[];
    requiredTests?: string[];
  };

  @ApiProperty({ enum: UrgencyLevel, example: UrgencyLevel.SOON, description: 'Urgency level of the case' })
  urgencyLevel!: UrgencyLevel;

  @ApiProperty({ enum: RiskLevel, example: RiskLevel.LOW, description: 'Risk level assessment' })
  riskLevel!: RiskLevel;

  @ApiProperty({ example: 0.85, description: 'Overall confidence in the assessment' })
  confidence!: number;
} 