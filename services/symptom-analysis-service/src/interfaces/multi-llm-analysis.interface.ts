import { ApiProperty } from '@nestjs/swagger';

export enum ConfidenceLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum UrgencyLevel {
  EMERGENCY = 'EMERGENCY',
  URGENT = 'URGENT',
  ROUTINE = 'ROUTINE',
  SELF_CARE = 'SELF_CARE'
}

export class PossibleCondition {
  @ApiProperty({
    description: 'Name of the possible condition',
    example: 'Acute Coronary Syndrome'
  })
  name: string;

  @ApiProperty({
    description: 'Confidence level in this diagnosis',
    enum: ConfidenceLevel,
    example: ConfidenceLevel.HIGH
  })
  confidence: ConfidenceLevel;

  @ApiProperty({
    description: 'Supporting evidence from symptoms and context',
    type: [String],
    example: [
      'Chest pain worsening with activity',
      'Associated shortness of breath',
      'History of hypertension'
    ]
  })
  supportingEvidence: string[];

  @ApiProperty({
    description: 'Evidence that doesn\'t fit this diagnosis',
    type: [String],
    required: false,
    example: ['Pain improves with position change']
  })
  contradictingEvidence?: string[];
}

export class RiskFactor {
  @ApiProperty({
    description: 'Name of the risk factor',
    example: 'Hypertension'
  })
  name: string;

  @ApiProperty({
    description: 'How this factor increases risk',
    example: 'Increases risk of cardiovascular complications'
  })
  impact: string;

  @ApiProperty({
    description: 'Recommendations for managing this risk factor',
    type: [String],
    example: [
      'Continue blood pressure medications',
      'Regular blood pressure monitoring'
    ]
  })
  recommendations: string[];
}

export class TreatmentRecommendation {
  @ApiProperty({
    description: 'Type of treatment',
    example: 'Medication'
  })
  type: string;

  @ApiProperty({
    description: 'Specific treatment recommendation',
    example: 'Consider sublingual nitroglycerin if prescribed'
  })
  recommendation: string;

  @ApiProperty({
    description: 'Rationale for this recommendation',
    example: 'Can provide immediate relief for anginal chest pain'
  })
  rationale: string;

  @ApiProperty({
    description: 'Precautions or warnings',
    type: [String],
    required: false,
    example: [
      'Do not use if systolic blood pressure < 90',
      'Sit or lie down when taking'
    ]
  })
  precautions?: string[];
}

export class LLMAnalysis {
  @ApiProperty({
    description: 'Name of the LLM model',
    example: 'Clinical Assessment Model v2'
  })
  modelName: string;

  @ApiProperty({
    description: 'Specialty focus of this analysis',
    example: 'Cardiovascular'
  })
  specialty: string;

  @ApiProperty({
    description: 'List of possible conditions identified',
    type: [PossibleCondition]
  })
  possibleConditions: PossibleCondition[];

  @ApiProperty({
    description: 'Confidence in the overall analysis',
    enum: ConfidenceLevel,
    example: ConfidenceLevel.HIGH
  })
  confidence: ConfidenceLevel;

  @ApiProperty({
    description: 'Key findings from the analysis',
    type: [String],
    example: [
      'Symptoms consistent with acute coronary syndrome',
      'Multiple cardiovascular risk factors present'
    ]
  })
  keyFindings: string[];
}

export class MultiLLMAnalysisResponse {
  @ApiProperty({
    description: 'Unique identifier for this analysis',
    example: 'ANALYSIS-1234567'
  })
  analysisId: string;

  @ApiProperty({
    description: 'Timestamp of the analysis',
    example: '2024-01-20T15:30:00Z'
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Individual LLM analyses',
    type: [LLMAnalysis]
  })
  llmAnalyses: LLMAnalysis[];

  @ApiProperty({
    description: 'Consolidated list of possible conditions',
    type: [PossibleCondition]
  })
  consolidatedConditions: PossibleCondition[];

  @ApiProperty({
    description: 'Identified risk factors',
    type: [RiskFactor]
  })
  riskFactors: RiskFactor[];

  @ApiProperty({
    description: 'Treatment recommendations',
    type: [TreatmentRecommendation]
  })
  recommendations: TreatmentRecommendation[];

  @ApiProperty({
    description: 'Recommended urgency of care',
    enum: UrgencyLevel,
    example: UrgencyLevel.URGENT
  })
  urgencyLevel: UrgencyLevel;

  @ApiProperty({
    description: 'Whether immediate emergency care is needed',
    example: false
  })
  requiresEmergencyCare: boolean;

  @ApiProperty({
    description: 'Recommended follow-up timeframe',
    example: 'Within 24 hours'
  })
  followUpTimeframe: string;

  @ApiProperty({
    description: 'Warning signs to watch for',
    type: [String],
    example: [
      'Severe chest pain lasting > 10 minutes',
      'Loss of consciousness',
      'Difficulty breathing'
    ]
  })
  warningSigns: string[];

  @ApiProperty({
    description: 'Confidence in the consolidated analysis',
    enum: ConfidenceLevel,
    example: ConfidenceLevel.HIGH
  })
  overallConfidence: ConfidenceLevel;
} 