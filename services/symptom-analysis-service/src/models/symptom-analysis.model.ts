import { QuestionnaireDto } from './questionnaire.dto';
import { MedicalReport } from './medical-report.model';

export interface SymptomAnalysis {
  id: string;
  userId: string;
  data: QuestionnaireDto;
  status: 'pending' | 'processing' | 'completed' | 'error';
  report?: MedicalReport;
  createdAt: string;
  updatedAt: string;
} 