import { MedicalReport } from '@app/common';
import { QuestionnaireDto } from './questionnaire.dto';

export interface SymptomAnalysis {
  id: string;
  userId: string;
  data: QuestionnaireDto;
  status: 'pending' | 'completed' | 'failed';
  report?: MedicalReport;
  createdAt: string;
  updatedAt: string;
} 