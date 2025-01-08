export interface QuestionnaireDto {
  symptoms: string[];
  medicalHistory: string[];
  medications: string[];
  allergies: string[];
  additionalNotes?: string;
} 