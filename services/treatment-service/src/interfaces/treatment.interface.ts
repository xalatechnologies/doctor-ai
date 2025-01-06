import { ApiProperty } from '@nestjs/swagger';

export enum TreatmentType {
  MEDICATION = 'MEDICATION',
  PHYSICAL_THERAPY = 'PHYSICAL_THERAPY',
  SURGERY = 'SURGERY',
  COUNSELING = 'COUNSELING',
  LIFESTYLE = 'LIFESTYLE',
}

export enum TreatmentPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TreatmentStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD',
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  type: TreatmentType;
  description: string;
  priority: TreatmentPriority;
  medications?: string[];
  instructions: string[];
  precautions?: string[];
  contraindications?: string[];
  duration: number;
  frequency: string;
  status: TreatmentStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface TreatmentProgress {
  id: string;
  treatmentPlanId: string;
  date: string;
  notes?: string;
  observations?: string[];
  complications?: string[];
  adjustments?: string[];
  status: TreatmentStatus;
  nextCheckupDate?: string;
  createdAt: string;
  updatedAt: string;
} 