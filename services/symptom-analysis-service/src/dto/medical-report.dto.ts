import { ApiProperty } from '@nestjs/swagger';
import { MedicalReport, SymptomAssessment, VitalSignsAssessment, DiagnosticImpression } from '@app/common';

export class SymptomAssessmentDto implements SymptomAssessment {
  @ApiProperty({ description: 'Description of the symptom' })
  description!: string;

  @ApiProperty({ description: 'Severity level of the symptom', required: false })
  severity?: number;

  @ApiProperty({ description: 'Duration of the symptom' })
  duration!: string;

  @ApiProperty({ description: 'Onset of the symptom' })
  onset!: string;

  @ApiProperty({ description: 'Medical interpretation of the symptom' })
  interpretation!: string;

  @ApiProperty({ description: 'Associated risk factors', type: [String] })
  riskFactors!: string[];
}

export class VitalSignsAssessmentDto implements VitalSignsAssessment {
  @ApiProperty({ description: 'Blood pressure reading', required: false })
  bloodPressure?: string;

  @ApiProperty({ description: 'Heart rate in BPM', required: false })
  heartRate?: number;

  @ApiProperty({ description: 'Body temperature', required: false })
  temperature?: number;

  @ApiProperty({ description: 'Respiratory rate', required: false })
  respiratoryRate?: number;

  @ApiProperty({ description: 'Oxygen saturation level', required: false })
  oxygenSaturation?: number;

  @ApiProperty({ description: 'Summary of vital signs assessment' })
  summary!: string;

  @ApiProperty({ description: 'Clinical findings', type: [String] })
  findings!: string[];

  @ApiProperty({ description: 'Whether immediate medical attention is required' })
  requiresAttention!: boolean;
}

export class DiagnosticImpressionDto implements DiagnosticImpression {
  @ApiProperty({ description: 'Primary diagnosis' })
  primaryDiagnosis!: string;

  @ApiProperty({ description: 'List of differential diagnoses', type: [String] })
  differentialDiagnoses!: string[];

  @ApiProperty({ description: 'Confidence level in the diagnosis' })
  confidence!: number;
}

export class MedicalReportDto implements MedicalReport {
  @ApiProperty({ description: 'Unique identifier for the report' })
  reportId!: string;

  @ApiProperty({ description: 'Timestamp of report generation' })
  timestamp!: Date;

  @ApiProperty({ description: 'Patient identifier' })
  patientId!: string;

  @ApiProperty({ description: 'Symptom assessments', type: [SymptomAssessmentDto] })
  symptoms!: SymptomAssessment[];

  @ApiProperty({ description: 'Vital signs assessment', type: VitalSignsAssessmentDto })
  vitalSigns!: VitalSignsAssessment;

  @ApiProperty({ description: 'Diagnostic impression', type: DiagnosticImpressionDto })
  diagnosis!: DiagnosticImpression;

  @ApiProperty({ description: 'Medical recommendations', type: [String] })
  recommendations!: string[];

  @ApiProperty({ description: 'Follow-up plan', type: [String] })
  followUpPlan!: string[];

  @ApiProperty({
    description: 'Urgency level of the case',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
  })
  urgencyLevel!: 'LOW' | 'MEDIUM' | 'HIGH';
} 