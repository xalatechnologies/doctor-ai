export interface MedicalReportInput {
  symptoms: string[];
  medicalHistory: string[];
  medications: string[];
  allergies: string[];
  additionalNotes?: string;
} 