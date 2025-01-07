import { ApiProperty } from '@nestjs/swagger';
import { ReportType } from '../dto/medical-report-input.dto';
import { SymptomSeverity } from '../dto/adaptive-questionnaire.dto';

export class VitalSignsAssessment {
  @ApiProperty({
    description: 'Overall assessment of vital signs',
    example: 'Within normal limits'
  })
  summary: string;

  @ApiProperty({
    description: 'Specific findings for each vital sign',
    type: [String],
    example: ['Blood pressure: Elevated', 'Heart rate: Normal']
  })
  findings: string[];

  @ApiProperty({
    description: 'Whether any vital signs require immediate attention',
    example: false
  })
  requiresAttention: boolean;
}

export class SymptomAssessment {
  @ApiProperty({
    description: 'Name of the symptom',
    example: 'chest pain'
  })
  name: string;

  @ApiProperty({
    description: 'Current severity level',
    enum: SymptomSeverity,
    example: SymptomSeverity.MODERATE
  })
  severity: SymptomSeverity;

  @ApiProperty({
    description: 'Duration of the symptom',
    example: '3 days'
  })
  duration: string;

  @ApiProperty({
    description: 'Clinical interpretation of the symptom',
    example: 'Consistent with musculoskeletal origin'
  })
  interpretation: string;

  @ApiProperty({
    description: 'Associated risk factors',
    type: [String],
    example: ['recent physical exertion', 'history of hypertension']
  })
  riskFactors: string[];
}

export class DiagnosticImpression {
  @ApiProperty({
    description: 'Primary diagnostic impression',
    example: 'Acute Coronary Syndrome'
  })
  primaryImpression: string;

  @ApiProperty({
    description: 'Confidence level in the primary impression',
    example: 0.85
  })
  confidence: number;

  @ApiProperty({
    description: 'Supporting evidence for the impression',
    type: [String],
    example: [
      'Characteristic chest pain',
      'Elevated blood pressure',
      'Risk factors present'
    ]
  })
  supportingEvidence: string[];

  @ApiProperty({
    description: 'Differential diagnoses to consider',
    type: [String],
    example: [
      'Musculoskeletal chest pain',
      'Gastroesophageal reflux',
      'Anxiety-related symptoms'
    ]
  })
  differentialDiagnoses: string[];
}

export class TreatmentPlan {
  @ApiProperty({
    description: 'Immediate actions required',
    type: [String],
    example: ['ECG monitoring', 'Aspirin 325mg']
  })
  immediateActions: string[];

  @ApiProperty({
    description: 'Medications to be prescribed',
    type: [String],
    example: ['Nitroglycerin 0.4mg SL PRN']
  })
  medications: string[];

  @ApiProperty({
    description: 'Additional tests or investigations needed',
    type: [String],
    example: ['Cardiac enzymes', 'Chest X-ray']
  })
  investigations: string[];

  @ApiProperty({
    description: 'Specialist referrals required',
    type: [String],
    example: ['Cardiology consultation']
  })
  referrals: string[];

  @ApiProperty({
    description: 'Follow-up recommendations',
    type: [String],
    example: ['Follow-up with cardiology within 48 hours']
  })
  followUp: string[];
}

export class MedicalReport {
  @ApiProperty({
    description: 'Unique identifier for the report',
    example: 'REP-1234567'
  })
  reportId: string;

  @ApiProperty({
    description: 'Type of medical report',
    enum: ReportType,
    example: ReportType.INITIAL_ASSESSMENT
  })
  reportType: ReportType;

  @ApiProperty({
    description: 'When the report was generated',
    example: '2024-03-15T14:30:00Z'
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Patient identifier',
    example: 'PAT-123456'
  })
  patientId: string;

  @ApiProperty({
    description: 'Assessment of vital signs',
    type: VitalSignsAssessment
  })
  vitalSigns: VitalSignsAssessment;

  @ApiProperty({
    description: 'Assessment of each symptom',
    type: [SymptomAssessment]
  })
  symptoms: SymptomAssessment[];

  @ApiProperty({
    description: 'Diagnostic impressions',
    type: DiagnosticImpression
  })
  diagnosis: DiagnosticImpression;

  @ApiProperty({
    description: 'Treatment and management plan',
    type: TreatmentPlan
  })
  treatmentPlan: TreatmentPlan;

  @ApiProperty({
    description: 'Whether emergency care is needed',
    example: false
  })
  requiresEmergencyCare: boolean;

  @ApiProperty({
    description: 'Key recommendations',
    type: [String],
    example: [
      'Immediate cardiology evaluation',
      'Avoid strenuous activity',
      'Return if symptoms worsen'
    ]
  })
  recommendations: string[];

  @ApiProperty({
    description: 'Additional notes or observations',
    required: false,
    example: 'Patient education provided regarding risk factors and lifestyle modifications'
  })
  notes?: string;
} 