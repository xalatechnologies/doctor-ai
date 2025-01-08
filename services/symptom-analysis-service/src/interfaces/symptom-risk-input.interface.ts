/**
 * Input data for symptom risk assessment.
 */
export interface SymptomRiskInput {
  readonly symptoms: readonly string[];
  readonly age?: number;
  readonly gender?: string;
  readonly medicalHistory?: string;
  readonly currentMedications?: readonly string[];
  readonly allergies?: readonly string[];
  readonly vitalSigns?: Readonly<Record<string, number>>;
} 