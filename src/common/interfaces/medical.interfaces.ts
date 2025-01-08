import { ApiProperty } from '@nestjs/swagger';

export interface SymptomDetail {
  description: string;
  severity: number;
  duration: string;
  onset: string;
  location?: string;
  characteristics?: string[];
  severityLevel?: number;
}

export interface VitalSignsAssessment {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  summary: string;
  findings: string[];
  requiresAttention: boolean;
}

export interface DiagnosticImpression {
  primaryDiagnosis: string;
  differentialDiagnoses: string[];
  confidence: number;
}

export interface SymptomAssessment {
  description: string;
  severity?: number;
  duration: string;
  onset: string;
  interpretation: string;
  riskFactors: string[];
}

export interface MedicalReport {
  reportId: string;
  timestamp: Date;
  patientId: string;
  symptoms: SymptomAssessment[];
  vitalSigns: VitalSignsAssessment;
  diagnosis: DiagnosticImpression;
  recommendations: string[];
  followUpPlan: string[];
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface MedicalReportInput {
  symptoms: string[];
  medicalHistory?: string;
  medications?: string[];
  allergies?: string[];
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
  };
}

export interface SymptomRiskInput {
  symptoms: string[];
  medicalHistory?: string;
  severityLevel: number;
  age?: number;
}

export interface RiskAssessmentResponse {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendations: string[];
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  followUpRequired: boolean;
  timestamp: string;
} 