import { InitialSchema1704672000000 } from './1_initial_schema';
import { EmergencyAssessment1704672000001 } from './2_emergency_assessment';
import { TreatmentPlans1704672000002 } from './3_treatment_plans';
import { Monitoring1704672000003 } from './4_monitoring';
import { LlmInteractions1704672000004 } from './5_llm_interactions';
import { Symptoms1704672000005 } from './6_symptoms';
import { PatientSymptomsHistory1704672000006 } from './7_patient_symptoms_history';
import { SymptomAnalysisConfig1704672000007 } from './8_symptom_analysis_config';

export const migrations = [
  InitialSchema1704672000000,
  EmergencyAssessment1704672000001,
  TreatmentPlans1704672000002,
  Monitoring1704672000003,
  LlmInteractions1704672000004,
  Symptoms1704672000005,
  PatientSymptomsHistory1704672000006,
  SymptomAnalysisConfig1704672000007,
];

export * from './1_initial_schema';
export * from './2_emergency_assessment';
export * from './3_treatment_plans';
export * from './4_monitoring';
export * from './5_llm_interactions';
export * from './6_symptoms';
export * from './7_patient_symptoms_history';
export * from './8_symptom_analysis_config'; 