import { ApiProperty } from '@nestjs/swagger';
import { SymptomSeverity } from '../dto/adaptive-questionnaire.dto';

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
  diagnosis: {
    primaryDiagnosis: string;
    differentialDiagnoses: string[];
    confidence: number;
  };
  recommendations: string[];
  followUpPlan: string[];
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
} 