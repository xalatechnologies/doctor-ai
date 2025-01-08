export interface LLMAnalysisInput {
  text: string;
  context?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMAnalysisResult {
  differentials: string[];
  immediateActions: string[];
  followUp: string[];
  risks: string[];
  isUrgent: boolean;
  confidence: number;
  primaryDiagnosis: string;
  analysis: string;
  vitalSignsSummary: string;
  abnormalFindings: string[];
} 