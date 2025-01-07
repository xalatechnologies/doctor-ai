import { ApiProperty } from '@nestjs/swagger';

export class MedicalReportDto {
  @ApiProperty({ description: 'Unique identifier for the report' })
  reportId: string;

  @ApiProperty({ description: 'Timestamp of report generation' })
  timestamp: Date;

  @ApiProperty({ description: 'Patient identifier' })
  patientId: string;

  @ApiProperty({ description: 'Assessed symptoms' })
  symptoms: {
    description: string;
    severity: number;
    duration: string;
    onset: string;
    interpretation: string;
    riskFactors: string[];
  }[];

  @ApiProperty({ description: 'Vital signs assessment' })
  vitalSigns: {
    temperature: number;
    heartRate: number;
    bloodPressure: {
      systolic: number;
      diastolic: number;
    };
    respiratoryRate: number;
    oxygenSaturation: number;
    summary: string;
    findings: string[];
    requiresAttention: boolean;
  };

  @ApiProperty({ description: 'Diagnostic impression' })
  diagnosis: {
    primaryDiagnosis: string;
    differentialDiagnoses: string[];
    confidence: number;
  };

  @ApiProperty({ description: 'Recommended actions' })
  recommendations: string[];

  @ApiProperty({ description: 'Follow-up plan' })
  followUpPlan: string[];

  @ApiProperty({ description: 'Urgency level', enum: ['LOW', 'MEDIUM', 'HIGH'] })
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
} 