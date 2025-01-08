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
export interface RiskAssessmentResponse {
  readonly riskLevel: RiskLevel;
  readonly confidence: number;
  readonly explanation: string;
  readonly recommendations: readonly string[];
  readonly urgencyLevel: UrgencyLevel;
  readonly followUpRequired: boolean;
} 