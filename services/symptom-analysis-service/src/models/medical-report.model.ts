export interface MedicalReport {
  id: string;
  patientId: string;
  symptoms: {
    description: string;
    severity: number;
    duration: string;
    interpretation: string;
    riskFactors: string[];
  }[];
  diagnosis: {
    primaryDiagnosis: string;
    differentialDiagnoses: string[];
    confidence: number;
  };
  recommendations: string[];
  followUpPlan: string[];
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  updatedAt: string;
} 