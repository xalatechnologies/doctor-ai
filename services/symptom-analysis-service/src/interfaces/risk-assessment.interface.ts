export enum RiskLevel {
  VERY_LOW = 'VERY_LOW',
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH'
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
  MUSCULOSKELETAL = 'MUSCULOSKELETAL'
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

export interface SymptomRiskInput {
  primarySymptom: {
    name: string;
    severity: number;
    duration: string;
  };
  riskCategories: RiskCategory[];
  vitalSigns?: {
    bloodPressureSystolic: number;
    bloodPressureDiastolic: number;
    heartRate: number;
    temperature: number;
    oxygenSaturation: number;
  };
  lifestyleFactors: {
    smokingPerDay: number;
    alcoholUnitsPerWeek: number;
    exerciseHoursPerWeek: number;
    stressLevel: number;
    sleepHoursPerDay: number;
  };
  medicalContext?: {
    chronicConditions: string[];
    currentMedications: string[];
  };
  familyHistory?: {
    familyConditions: string[];
  };
  includeLongTermRisk?: boolean;
}

export interface RiskAssessmentResponse {
  assessmentId: string;
  timestamp: Date;
  categoryAssessments: CategoryRiskAssessment[];
  highestRiskLevel: RiskLevel;
  priorityCategories: RiskCategory[];
  followUpTimeframe: string;
  requiresEmergencyCare: boolean;
  overallConfidence: ConfidenceLevel;
  lifestyleRecommendations: string[];
  specialistReferrals: string[];
} 