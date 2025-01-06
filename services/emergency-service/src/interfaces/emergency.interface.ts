export enum EmergencySeverity {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum EmergencyCategory {
  CARDIAC = 'CARDIAC',
  RESPIRATORY = 'RESPIRATORY',
  TRAUMA = 'TRAUMA',
  NEUROLOGICAL = 'NEUROLOGICAL',
  GENERAL = 'GENERAL',
}

export interface EmergencyAssessment {
  severity: EmergencySeverity;
  category: EmergencyCategory;
  recommendations: string[];
  immediateActions: string[];
  requiresAmbulance: boolean;
  timestamp: string;
  triageScore: number;
} 