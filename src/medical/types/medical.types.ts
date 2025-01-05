import { Injectable } from '@nestjs/common';

export interface PatientContext {
  age: number;
  gender: string;
  medicalHistory: string[];
  currentMedications: string[];
  allergies: string[];
  chronicConditions: string[];
}

export interface MedicalAnalysisResult {
  diagnosis: DiagnosisResult[];
  confidence: number;
  recommendations: string[];
  urgencyLevel: 'immediate' | 'urgent' | 'semi-urgent' | 'non-urgent';
  followUpRequired: boolean;
}

export interface DiagnosisResult {
  condition: string;
  probability: number;
  severity: number;
  supportingEvidence: string[];
  differentialDiagnoses: string[];
}

export interface CulturalHealthBelief {
  belief: string;
  impact: 'high' | 'medium' | 'low';
  considerations: string[];
  alternatives: string[];
}

export interface TreatmentPlan {
  medications: string[];
  lifestyle: string[];
  followUp: string[];
  restrictions: string[];
}

export interface CulturalContext {
  region: string;
  language: string;
  religiousConsiderations: string[];
  dietaryPractices: string[];
  traditionalMedicine: boolean;
  familyInvolvement: 'high' | 'medium' | 'low';
}

export interface LocalizedTreatmentPlan extends TreatmentPlan {
  culturalAdaptations: string[];
  localAlternatives: string[];
  translatedInstructions: Record<string, string>;
}

export interface AdaptedDiagnosis {
  originalDiagnosis: DiagnosisResult;
  culturalConsiderations: string[];
  modifiedRecommendations: string[];
  communicationStrategy: string[];
}

export interface VitalSigns {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
}

export interface EmergencyRecommendation {
  action: string;
  priority: number;
  timeframe: string;
  instructions: string;
}

export interface EmergencyFacility {
  name: string;
  distance: number;
  specialties: string[];
  contactInfo: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface SymptomAnalysis {
  primarySymptoms: {
    symptom: string;
    severity: number;
    duration: string;
    frequency: string;
    characteristics: string[];
  }[];
  
  associatedSymptoms: {
    symptom: string;
    relation: 'direct' | 'indirect' | 'possible';
    timeOfOnset: string;
  }[];

  riskFactors: {
    factor: string;
    impact: 'high' | 'medium' | 'low';
    details: string;
  }[];

  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
    respiratoryRate?: number;
  };

  environmentalFactors: {
    factor: string;
    relevance: number;
    description: string;
  }[];
} 