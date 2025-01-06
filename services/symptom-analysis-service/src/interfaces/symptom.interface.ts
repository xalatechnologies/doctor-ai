import { ApiProperty } from '@nestjs/swagger';

export class Severity {
  @ApiProperty({ example: 8, description: 'Severity level from 0 to 10' })
  level: number;

  @ApiProperty({ example: 'Severe', description: 'Description of the severity level' })
  description: string;
}

export class SymptomAnalysis {
  @ApiProperty({ example: 'SYM-1234567890-abc', description: 'Unique identifier for the symptom analysis' })
  symptomId: string;

  @ApiProperty({ example: 'chest pain', description: 'Primary symptom reported by the patient' })
  primarySymptom: string;

  @ApiProperty({ example: ['shortness of breath'], description: 'List of secondary symptoms' })
  secondarySymptoms: string[];

  @ApiProperty({ type: Severity })
  severity: Severity;

  @ApiProperty({ example: ['Possible heart condition'], description: 'List of possible conditions based on symptoms' })
  possibleConditions: string[];

  @ApiProperty({ example: ['Seek immediate medical attention'], description: 'List of recommendations' })
  recommendations: string[];

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH'], example: 'HIGH', description: 'Urgency level of the symptoms' })
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiProperty({ example: ['Cardiology'], description: 'List of required medical specialties' })
  requiredSpecialties: string[];

  @ApiProperty({ example: ['Schedule immediate consultation'], description: 'List of follow-up actions' })
  followUpActions: string[];

  @ApiProperty({ example: '2024-01-06T12:00:00Z', description: 'Timestamp of the analysis' })
  timestamp: string;
}

export class FollowUpPlan {
  @ApiProperty({ example: ['Call emergency services'], description: 'List of immediate actions to take' })
  immediateActions: string[];

  @ApiProperty({ example: 'Schedule follow-up within 48 hours', description: 'Short-term follow-up plan' })
  shortTermFollowUp: string;

  @ApiProperty({ example: 'Regular check-ups', description: 'Long-term monitoring plan' })
  longTermMonitoring: string;
}

export class EmergencyAnalysis {
  @ApiProperty({ example: '2024-01-06T12:00:00Z', description: 'Timestamp of the emergency analysis' })
  timestamp: string;

  @ApiProperty({ example: 'CARDIAC', description: 'Category of the emergency' })
  emergencyCategory: string;

  @ApiProperty({ example: ['Monitor vital signs'], description: 'Detailed recommendations for the emergency' })
  detailedRecommendations: string[];

  @ApiProperty({ example: ['Cardiologist'], description: 'List of specialist referrals' })
  specialistReferrals: string[];

  @ApiProperty({ type: FollowUpPlan })
  followUpPlan: FollowUpPlan;
} 