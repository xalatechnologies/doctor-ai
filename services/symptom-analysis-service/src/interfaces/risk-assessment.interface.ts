export enum RiskLevel {
  VERY_LOW = 'VERY_LOW',
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
  SEVERE = 'SEVERE'
}

export enum ConfidenceLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum RiskCategory {
  CARDIOVASCULAR = 'CARDIOVASCULAR',
  RESPIRATORY = 'RESPIRATORY',
  NEUROLOGICAL = 'NEUROLOGICAL',
  GASTROINTESTINAL = 'GASTROINTESTINAL',
  MUSCULOSKELETAL = 'MUSCULOSKELETAL',
  PSYCHOLOGICAL = 'PSYCHOLOGICAL',
  ENDOCRINE = 'ENDOCRINE',
  INFECTIOUS = 'INFECTIOUS',
  OTHER = 'OTHER'
}

export enum TimeFrame {
  IMMEDIATE = 'IMMEDIATE',
  SHORT_TERM = 'SHORT_TERM',
  MEDIUM_TERM = 'MEDIUM_TERM',
  LONG_TERM = 'LONG_TERM'
}

export interface RiskFactor {
  name: string;
  impact: RiskLevel;
  description?: string;
  modifiable: boolean;
  recommendations: string[];
}

export interface RiskProjection {
  timeFrame: TimeFrame;
  riskLevel: RiskLevel;
  influencingFactors: string[];
  potentialOutcomes: string[];
  recommendedInterventions: string[];
}

export interface CategoryRiskAssessment {
  category: RiskCategory;
  overallRisk: RiskLevel;
  confidence: ConfidenceLevel;
  riskFactors: RiskFactor[];
  projections: RiskProjection[];
  keyFindings: string[];
  warningSignsToMonitor: string[];
}

export interface RiskAssessmentResponse {
  overallRisk: RiskLevel;
  confidence: ConfidenceLevel;
  categoryAssessments: CategoryRiskAssessment[];
  emergencyIndicators: string[];
  recommendations: string[];
}

export interface SymptomRiskInput {
  symptoms: {
    name: string;
    severity: string;
    duration: string;
    details?: string;
  }[];
  vitalSigns?: {
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
    temperature?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
  };
  medicalContext?: {
    chronicConditions?: string[];
    currentMedications?: string[];
  };
  familyHistory?: {
    familyConditions?: string[];
  };
  lifestyleFactors?: {
    smokingPerDay: number;
    alcoholUnitsPerWeek: number;
    exerciseHoursPerWeek: number;
    stressLevel: number;
    sleepHoursPerDay: number;
  };
  includeLongTermRisk?: boolean;
} 