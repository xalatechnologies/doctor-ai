export enum TreatmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DISCONTINUED = 'DISCONTINUED'
}

export interface Medication {
  name: string;
  dosage: string;
  route: string;
  frequency: string;
  startDate?: Date;
  endDate?: Date;
}

export interface FollowUpSchedule {
  date: Date;
  type: string;
  notes: string;
  completed: boolean;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  diagnosis: string;
  medications: Medication[];
  followUpSchedule: FollowUpSchedule[];
  recommendations?: string[];
  lifestyle?: string[];
  notes?: string;
  status: TreatmentStatus;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SymptomProgress {
  name: string;
  severity: number;
  previousSeverity: number;
  notes?: string;
}

export interface MedicationAdherence {
  medicationId: string;
  adherenceRate: number;
  missedDoses: number;
  sideEffects?: string[];
}

export interface TreatmentProgress {
  treatmentPlanId: string;
  symptoms: SymptomProgress[];
  medicationAdherence: MedicationAdherence[];
  notes?: string;
  updatedAt: Date;
}

export interface TreatmentAnalysis {
  treatmentPlanId: string;
  patientId: string;
  symptomImprovement: boolean;
  medicationAdherence: boolean;
  needsAdjustment: boolean;
  recommendations: string[];
  analyzedAt: Date;
}

export interface EmergencyTreatment {
  emergencyId: string;
  recommendedActions: string[];
  medications: Medication[];
  notes?: string;
  createdAt: Date;
} 