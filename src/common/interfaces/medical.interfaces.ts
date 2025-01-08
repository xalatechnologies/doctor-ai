import { ApiProperty } from '@nestjs/swagger';

/**
 * Detailed information about a reported symptom.
 */
export interface ISymptomDetail {
  readonly name: string;
  readonly description: string;
  readonly severity: number;
  readonly onset: string;
  readonly duration: string;
  readonly location?: string;
  readonly characteristics?: readonly string[];
}

/**
 * Patient's vital signs measurements and assessment.
 */
export interface IVitalSigns {
  readonly summary: string;
  readonly findings: readonly string[];
  readonly requiresAttention: boolean;
  readonly measurements?: Readonly<Record<string, number>>;
}

/**
 * Medical diagnosis with confidence level and supporting evidence.
 */
export interface IDiagnosis {
  readonly primary: string;
  readonly differential: readonly string[];
  readonly confidence: number;
  readonly evidence: readonly string[];
  readonly icd10Code?: string;
}

/**
 * Follow-up care plan for the patient.
 */
export interface IFollowUpPlan {
  readonly timing: string;
  readonly type: string;
  readonly recommendations: readonly string[];
  readonly specialistReferral?: string;
  readonly tests?: readonly string[];
}

/**
 * Comprehensive medical report containing diagnosis, recommendations, and follow-up plan.
 */
export interface IMedicalReport {
  readonly reportId: string;
  readonly timestamp: Date;
  readonly patientId: string;
  readonly symptoms: readonly {
    readonly onset: string;
    readonly name: string;
    readonly description: string;
    readonly severity: number;
    readonly duration: string;
    readonly location?: string;
    readonly characteristics?: readonly string[];
  }[];
  readonly diagnosis: string;
  readonly recommendations: readonly string[];
  readonly vitalSigns: IVitalSignsDto;
  readonly riskLevel: RiskLevel;
  readonly urgencyLevel: UrgencyLevel;
  readonly confidence: number;
  readonly followUpPlan?: Readonly<{
    readonly timing: string;
    readonly instructions: readonly string[];
    readonly requiredTests?: readonly string[];
  }>;
}

/**
 * Input data required to generate a medical report.
 */
export interface IMedicalReportInput {
  readonly symptoms: readonly string[];
  readonly medicalHistory: string;
  readonly medications: readonly string[];
  readonly allergies: readonly string[];
  readonly vitalSigns: Readonly<Record<string, number>>;
}

/**
 * Input data for symptom risk assessment.
 */
export interface ISymptomRiskInput {
  readonly symptoms: readonly string[];
  readonly age?: number;
  readonly gender?: string;
  readonly medicalHistory?: string;
  readonly currentMedications?: readonly string[];
  readonly allergies?: readonly string[];
  readonly vitalSigns?: Readonly<Record<string, number>>;
}

/**
 * Risk levels for medical assessment.
 */
export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  EMERGENCY = 'EMERGENCY',
}

/**
 * Urgency levels for medical assessment.
 */
export enum UrgencyLevel {
  ROUTINE = 'ROUTINE',
  SOON = 'SOON',
  URGENT = 'URGENT',
  IMMEDIATE = 'IMMEDIATE',
}

/**
 * Response from risk assessment analysis.
 */
export interface IRiskAssessmentResponse {
  readonly riskLevel: RiskLevel;
  readonly confidence: number;
  readonly explanation: string;
  readonly recommendations: readonly string[];
  readonly urgencyLevel: UrgencyLevel;
  readonly followUpRequired: boolean;
}

/**
 * Data transfer object for vital signs measurements.
 */
export interface IVitalSignsDto {
  readonly heartRate?: number;
  readonly bloodPressureSystolic?: number;
  readonly bloodPressureDiastolic?: number;
  readonly temperature?: number;
  readonly respiratoryRate?: number;
  readonly oxygenSaturation?: number;
  readonly summary?: string;
  readonly findings?: readonly number[];
  readonly requiresAttention?: boolean;
  readonly [key: string]: number | string | boolean | readonly number[] | undefined;
}

// Type aliases for backward compatibility
export type SymptomDetail = ISymptomDetail;
export type VitalSigns = IVitalSigns;
export type Diagnosis = IDiagnosis;
export type FollowUpPlan = IFollowUpPlan;
export type MedicalReport = IMedicalReport;
export type MedicalReportInput = IMedicalReportInput;
export type SymptomRiskInput = ISymptomRiskInput;
export type RiskAssessmentResponse = IRiskAssessmentResponse;
export type VitalSignsDto = IVitalSignsDto; 