import { MedicalReport } from '@app/common';
import { QuestionnaireDto } from './questionnaire.dto';

/**
 * Status of a symptom analysis.
 */
export enum SymptomAnalysisStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Represents a symptom analysis record.
 */
export interface ISymptomAnalysis {
  readonly id: string;
  readonly userId: string;
  readonly data: QuestionnaireDto;
  readonly status: SymptomAnalysisStatus;
  readonly report?: MedicalReport;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Type alias for a symptom analysis record.
 */
export type SymptomAnalysis = ISymptomAnalysis; 