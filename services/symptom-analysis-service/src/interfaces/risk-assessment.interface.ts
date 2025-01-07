import { ApiProperty } from '@nestjs/swagger';
import { RiskCategory } from '@dto/symptom-risk-input.dto';
import { ConfidenceLevel } from './multi-llm-analysis.interface';

export enum RiskLevel {
  VERY_HIGH = 'VERY_HIGH',
  HIGH = 'HIGH',
  MODERATE = 'MODERATE',
  LOW = 'LOW',
  VERY_LOW = 'VERY_LOW'
}

export enum TimeFrame {
  IMMEDIATE = 'IMMEDIATE',
  SHORT_TERM = 'SHORT_TERM',
  MEDIUM_TERM = 'MEDIUM_TERM',
  LONG_TERM = 'LONG_TERM'
}

export class RiskFactor {
  @ApiProperty({
    description: 'Name of the risk factor',
    example: 'Hypertension'
  })
  name: string;

  @ApiProperty({
    description: 'Current impact level',
    enum: RiskLevel,
    example: RiskLevel.HIGH
  })
  impact: RiskLevel;

  @ApiProperty({
    description: 'Whether this factor can be modified through interventions',
    example: true
  })
  modifiable: boolean;

  @ApiProperty({
    description: 'Recommendations for risk reduction',
    type: [String],
    example: [
      'Regular blood pressure monitoring',
      'Medication adherence',
      'Dietary sodium reduction'
    ]
  })
  recommendations: string[];
}

export class RiskProjection {
  @ApiProperty({
    description: 'Time frame for the projection',
    enum: TimeFrame,
    example: TimeFrame.MEDIUM_TERM
  })
  timeFrame: TimeFrame;

  @ApiProperty({
    description: 'Projected risk level',
    enum: RiskLevel,
    example: RiskLevel.HIGH
  })
  riskLevel: RiskLevel;

  @ApiProperty({
    description: 'Key factors influencing this projection',
    type: [String],
    example: [
      'Current blood pressure trends',
      'Family history of early onset',
      'Lifestyle factors'
    ]
  })
  influencingFactors: string[];

  @ApiProperty({
    description: 'Potential outcomes if no intervention',
    type: [String],
    example: [
      'Increased risk of cardiovascular events',
      'Potential organ damage'
    ]
  })
  potentialOutcomes: string[];

  @ApiProperty({
    description: 'Recommended interventions for this timeframe',
    type: [String],
    example: [
      'Regular cardiology follow-up',
      'Lifestyle modifications',
      'Medication adjustment if needed'
    ]
  })
  recommendedInterventions: string[];
}

export class CategoryRiskAssessment {
  @ApiProperty({
    description: 'Risk category being assessed',
    enum: RiskCategory,
    example: RiskCategory.CARDIOVASCULAR
  })
  category: RiskCategory;

  @ApiProperty({
    description: 'Overall risk level for this category',
    enum: RiskLevel,
    example: RiskLevel.HIGH
  })
  overallRisk: RiskLevel;

  @ApiProperty({
    description: 'Confidence in the risk assessment',
    enum: ConfidenceLevel,
    example: ConfidenceLevel.HIGH
  })
  confidence: ConfidenceLevel;

  @ApiProperty({
    description: 'Contributing risk factors',
    type: [RiskFactor]
  })
  riskFactors: RiskFactor[];

  @ApiProperty({
    description: 'Risk projections over time',
    type: [RiskProjection],
    required: false
  })
  projections?: RiskProjection[];

  @ApiProperty({
    description: 'Key findings from the assessment',
    type: [String],
    example: [
      'Multiple high-risk factors present',
      'Strong family history',
      'Early onset indicators'
    ]
  })
  keyFindings: string[];

  @ApiProperty({
    description: 'Warning signs to monitor',
    type: [String],
    example: [
      'Chest pain or pressure',
      'Shortness of breath',
      'Dizziness'
    ]
  })
  warningSignsToMonitor: string[];
}

export class RiskAssessmentResponse {
  @ApiProperty({
    description: 'Unique identifier for this assessment',
    example: 'RISK-1234567'
  })
  assessmentId: string;

  @ApiProperty({
    description: 'Timestamp of the assessment',
    example: '2024-01-20T15:30:00Z'
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Risk assessments by category',
    type: [CategoryRiskAssessment]
  })
  categoryAssessments: CategoryRiskAssessment[];

  @ApiProperty({
    description: 'Overall highest risk level',
    enum: RiskLevel,
    example: RiskLevel.HIGH
  })
  highestRiskLevel: RiskLevel;

  @ApiProperty({
    description: 'Categories requiring immediate attention',
    enum: RiskCategory,
    isArray: true,
    example: [RiskCategory.CARDIOVASCULAR]
  })
  priorityCategories: RiskCategory[];

  @ApiProperty({
    description: 'Recommended follow-up timeframe',
    example: 'Within 1 week'
  })
  followUpTimeframe: string;

  @ApiProperty({
    description: 'Whether emergency care is recommended',
    example: false
  })
  requiresEmergencyCare: boolean;

  @ApiProperty({
    description: 'Overall confidence in the assessment',
    enum: ConfidenceLevel,
    example: ConfidenceLevel.HIGH
  })
  overallConfidence: ConfidenceLevel;

  @ApiProperty({
    description: 'Key lifestyle modifications recommended',
    type: [String],
    example: [
      'Smoking cessation',
      'Regular exercise',
      'Stress management'
    ]
  })
  lifestyleRecommendations: string[];

  @ApiProperty({
    description: 'Recommended specialist consultations',
    type: [String],
    example: [
      'Cardiologist',
      'Nutritionist'
    ]
  })
  specialistReferrals: string[];
} 