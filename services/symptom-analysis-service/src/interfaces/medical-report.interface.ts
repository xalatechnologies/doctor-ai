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
  temperature: number;
  heartRate: number;
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  respiratoryRate: number;
  oxygenSaturation: number;
  summary: string;
  findings: string[];
  requiresAttention: boolean;
}

export interface DiagnosticImpression {
  primaryDiagnosis: string;
  differentialDiagnoses: string[];
  confidence: number;
}

export interface SymptomAssessment extends SymptomDetail {
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