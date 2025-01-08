export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum UrgencyLevel {
  ROUTINE = 'ROUTINE',
  SOON = 'SOON',
  URGENT = 'URGENT',
  IMMEDIATE = 'IMMEDIATE'
}

export interface VitalSignsDto {
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  summary?: string;
  findings?: number[];
  requiresAttention?: boolean;
}

export interface Symptom {
  name: string;
  description: string;
  severity: number;
  onset: string;
  duration: string;
}

export interface MedicalReport {
  reportId: string;
  timestamp: Date;
  patientId: string;
  symptoms: Symptom[];
  vitalSigns?: VitalSignsDto;
  diagnosis: string[];
  recommendations: string[];
  followUpPlan: string[];
  urgencyLevel: UrgencyLevel;
  riskLevel: RiskLevel;
  confidence: number;
}

export interface MedicalReportInput {
  symptoms: string[];
  medicalHistory?: string;
  medications?: string[];
  allergies?: string[];
  vitalSigns?: VitalSignsDto;
}

export interface RiskAssessmentResponse {
  riskLevel: RiskLevel;
  confidence: number;
  explanation: string;
  recommendations: string[];
  urgencyLevel: UrgencyLevel;
  followUpRequired: boolean;
}

export interface SymptomRiskInput {
  symptoms: string[];
  severity: number;
  duration: string;
  medicalHistory?: string;
  medications?: string[];
  allergies?: string[];
  vitalSigns?: VitalSignsDto;
} 