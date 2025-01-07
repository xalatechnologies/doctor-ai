import { ApiProperty } from '@nestjs/swagger';

export enum EmergencyCategory {
  CARDIAC = 'CARDIAC',
  RESPIRATORY = 'RESPIRATORY',
  NEUROLOGICAL = 'NEUROLOGICAL',
  TRAUMA = 'TRAUMA',
  TOXICOLOGY = 'TOXICOLOGY',
  GENERAL = 'GENERAL',
}

export enum EmergencySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export class EmergencyAssessment {
  @ApiProperty()
  description: string;

  @ApiProperty()
  primarySymptom: string;

  @ApiProperty({ type: [String], required: false })
  secondarySymptoms?: string[];

  @ApiProperty()
  analysis: string;

  @ApiProperty()
  timestamp: string;
}

export class StabilizationPlan {
  @ApiProperty()
  planId: string;

  @ApiProperty()
  emergencyId: string;

  @ApiProperty({ type: [String] })
  immediateActions: string[];

  @ApiProperty({ type: [String] })
  monitoringRequirements: string[];

  @ApiProperty({ type: [String] })
  medicationInstructions: string[];

  @ApiProperty()
  estimatedStabilizationTime: number;

  @ApiProperty()
  requiresSpecialistConsult: boolean;

  @ApiProperty({ type: [String] })
  specialistTypes: string[];

  @ApiProperty()
  timestamp: string;
}

export class EmergencyResponse {
  @ApiProperty()
  assessment: EmergencyAssessment;

  @ApiProperty()
  stabilizationPlan: StabilizationPlan;

  @ApiProperty()
  responseId: string;

  @ApiProperty()
  timestamp: string;
}

export interface EmergencyTreatmentUpdate {
  patientId: string;
  treatmentPlanId: string;
  status: string;
  timestamp: string;
} 