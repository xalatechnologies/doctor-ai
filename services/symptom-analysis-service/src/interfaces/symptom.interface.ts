export interface SymptomAnalysis {
  symptomId: string;
  primarySymptom: string;
  secondarySymptoms: string[];
  severity: {
    level: number;
    description: string;
  };
  possibleConditions: string[];
  recommendations: string[];
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  requiredSpecialties: string[];
  followUpActions: string[];
  timestamp: string;
}

export interface EmergencyAnalysis {
  timestamp: string;
  emergencyCategory: string;
  detailedRecommendations: string[];
  specialistReferrals: string[];
  followUpPlan: {
    immediateActions: string[];
    shortTermFollowUp: string;
    longTermMonitoring: string;
  };
} 