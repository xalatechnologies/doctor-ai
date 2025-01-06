import { ApiProperty } from '@nestjs/swagger';

export enum TreatmentStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DISCONTINUED = 'DISCONTINUED',
}

export enum TreatmentType {
  MEDICATION = 'MEDICATION',
  PHYSICAL_THERAPY = 'PHYSICAL_THERAPY',
  SURGERY = 'SURGERY',
  COUNSELING = 'COUNSELING',
  LIFESTYLE = 'LIFESTYLE',
}

export enum TreatmentPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export class TreatmentPlan {
  @ApiProperty()
  id: string;

  @ApiProperty()
  patientId: string;

  @ApiProperty({ enum: TreatmentType })
  type: TreatmentType;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: TreatmentPriority })
  priority: TreatmentPriority;

  @ApiProperty({ type: [String] })
  medications: string[];

  @ApiProperty({ type: [String] })
  instructions: string[];

  @ApiProperty({ type: [String] })
  precautions: string[];

  @ApiProperty({ type: [String] })
  contraindications: string[];

  @ApiProperty()
  duration: number;

  @ApiProperty()
  frequency: string;

  @ApiProperty({ enum: TreatmentStatus })
  status: TreatmentStatus;

  @ApiProperty()
  startDate: string;

  @ApiProperty()
  endDate: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class TreatmentProgress {
  @ApiProperty()
  id: string;

  @ApiProperty()
  treatmentPlanId: string;

  @ApiProperty()
  date: string;

  @ApiProperty()
  notes: string;

  @ApiProperty({ type: [String] })
  observations: string[];

  @ApiProperty({ type: [String] })
  complications: string[];

  @ApiProperty({ type: [String] })
  adjustments: string[];

  @ApiProperty({ enum: TreatmentStatus })
  status: TreatmentStatus;

  @ApiProperty()
  nextCheckupDate: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class TreatmentResponse {
  @ApiProperty()
  treatmentPlan: TreatmentPlan;

  @ApiProperty()
  progress: TreatmentProgress;

  @ApiProperty()
  responseId: string;

  @ApiProperty()
  timestamp: string;
} 