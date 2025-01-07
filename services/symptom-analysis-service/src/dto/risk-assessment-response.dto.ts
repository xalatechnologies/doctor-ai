import { ApiProperty } from '@nestjs/swagger';
import {
  RiskLevel,
  ConfidenceLevel,
  RiskCategory,
  TimeFrame,
  RiskFactor,
  RiskProjection,
  CategoryRiskAssessment
} from '../interfaces/risk-assessment.interface';

export class RiskFactorDto implements RiskFactor {
  @ApiProperty({
    description: 'Name of the risk factor',
    example: 'Hypertension'
  })
  name: string;

  @ApiProperty({
    description: 'Impact level of the risk factor (0-1)',
    example: 0.8,
    minimum: 0,
    maximum: 1
  })
  impact: number;

  @ApiProperty({
    description: 'Detailed description of the risk factor',
    example: 'History of high blood pressure with poor control'
  })
  description: string;

  @ApiProperty({
    description: 'Category of the risk factor',
    enum: RiskCategory,
    example: RiskCategory.CARDIOVASCULAR
  })
  category: RiskCategory;

  @ApiProperty({
    description: 'Whether the risk factor can be modified through interventions',
    example: true
  })
  modifiable: boolean;
}

export class RiskProjectionDto implements RiskProjection {
  @ApiProperty({
    description: 'Time frame for the risk projection',
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
    description: 'Confidence in the projection (0-1)',
    example: 0.85,
    minimum: 0,
    maximum: 1
  })
  confidence: number;

  @ApiProperty({
    description: 'Risk factors contributing to the projection',
    type: [RiskFactorDto]
  })
  factors: RiskFactor[];
}

export class CategoryRiskAssessmentDto implements CategoryRiskAssessment {
  @ApiProperty({
    description: 'Category being assessed',
    enum: RiskCategory,
    example: RiskCategory.CARDIOVASCULAR
  })
  category: RiskCategory;

  @ApiProperty({
    description: 'Assessed risk level',
    enum: RiskLevel,
    example: RiskLevel.HIGH
  })
  riskLevel: RiskLevel;

  @ApiProperty({
    description: 'Confidence in the assessment (0-1)',
    example: 0.9,
    minimum: 0,
    maximum: 1
  })
  confidence: number;

  @ApiProperty({
    description: 'Risk factors identified in this category',
    type: [RiskFactorDto]
  })
  factors: RiskFactor[];

  @ApiProperty({
    description: 'Risk projections over different time frames',
    type: [RiskProjectionDto]
  })
  projections: RiskProjection[];
}

export class RiskAssessmentResponseDto {
  @ApiProperty({
    description: 'Overall risk level assessment',
    enum: RiskLevel,
    example: RiskLevel.HIGH
  })
  overallRisk: RiskLevel;

  @ApiProperty({
    description: 'Confidence level in the overall assessment',
    enum: ConfidenceLevel,
    example: ConfidenceLevel.HIGH
  })
  confidence: ConfidenceLevel;

  @ApiProperty({
    description: 'Risk assessments by category',
    type: [CategoryRiskAssessmentDto]
  })
  categoryAssessments: CategoryRiskAssessment[];

  @ApiProperty({
    description: 'Indicators requiring immediate medical attention',
    type: [String],
    example: [
      'Severe chest pain',
      'Difficulty breathing',
      'Signs of shock'
    ]
  })
  emergencyIndicators: string[];

  @ApiProperty({
    description: 'Recommended actions based on the assessment',
    type: [String],
    example: [
      'Seek immediate emergency care',
      'Monitor blood pressure regularly',
      'Schedule follow-up within 48 hours'
    ]
  })
  recommendations: string[];
} 