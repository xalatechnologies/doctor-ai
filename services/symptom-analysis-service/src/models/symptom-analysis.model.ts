import { MedicalReport } from '../interfaces/common';

/**
 * Status of a symptom analysis.
 */
export enum SymptomAnalysisStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Represents a symptom analysis record.
 */
export interface SymptomAnalysis {
  id: string;
  userId: string;
  data: {
    symptoms: string[];
    medicalHistory?: string;
    medications?: string[];
    allergies?: string[];
    vitalSigns?: {
      heartRate?: number;
      temperature?: number;
      respiratoryRate?: number;
      oxygenSaturation?: number;
      systolic?: number;
      diastolic?: number;
    };
  };
  status: SymptomAnalysisStatus;
  report?: MedicalReport;
  createdAt: string;
  updatedAt: string;
} 