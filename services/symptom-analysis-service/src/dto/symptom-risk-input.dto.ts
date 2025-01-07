import { IsString, IsArray, IsOptional, ValidateNested, IsEnum, IsNumber, Min, Max, IsBoolean, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { VitalSigns, MedicalContext, SymptomDetail } from './symptom-analysis-input.dto';

export enum RiskCategory {
  CARDIOVASCULAR = 'CARDIOVASCULAR',
  RESPIRATORY = 'RESPIRATORY',
  NEUROLOGICAL = 'NEUROLOGICAL',
  GASTROINTESTINAL = 'GASTROINTESTINAL',
  MUSCULOSKELETAL = 'MUSCULOSKELETAL'
}

export class LifestyleFactors {
  @ApiProperty({
    description: 'Smoking status (cigarettes per day)',
    example: 0,
    minimum: 0
  })
  @IsInt()
  @Min(0)
  smokingPerDay: number;

  @ApiProperty({
    description: 'Alcohol consumption (units per week)',
    example: 7,
    minimum: 0
  })
  @IsInt()
  @Min(0)
  alcoholUnitsPerWeek: number;

  @ApiProperty({
    description: 'Exercise frequency (hours per week)',
    example: 3,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  exerciseHoursPerWeek: number;

  @ApiProperty({
    description: 'Average sleep hours per day',
    example: 7,
    minimum: 0,
    maximum: 24
  })
  @IsNumber()
  @Min(0)
  @Max(24)
  sleepHoursPerDay: number;

  @ApiProperty({
    description: 'Stress level (1-10)',
    example: 5,
    minimum: 1,
    maximum: 10
  })
  @IsInt()
  @Min(1)
  @Max(10)
  stressLevel: number;
}

export class FamilyHistory {
  @ApiProperty({
    description: 'List of conditions in first-degree relatives',
    type: [String],
    required: false,
    example: ['heart disease', 'type 2 diabetes']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  familyConditions?: string[];

  @ApiProperty({
    description: 'Age of onset for each condition',
    type: [Number],
    required: false,
    example: [45, 50]
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  ageOfOnset?: number[];

  @ApiProperty({
    description: 'Relationship to affected family members',
    type: [String],
    required: false,
    example: ['father', 'mother']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relationships?: string[];
}

export class SymptomRiskInput {
  @ApiProperty({
    description: 'Primary symptom details',
    type: SymptomDetail
  })
  @ValidateNested()
  @Type(() => SymptomDetail)
  primarySymptom: SymptomDetail;

  @ApiProperty({
    description: 'Additional symptoms',
    type: [SymptomDetail],
    required: false
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SymptomDetail)
  secondarySymptoms?: SymptomDetail[];

  @ApiProperty({
    description: 'Vital signs measurements',
    type: VitalSigns
  })
  @ValidateNested()
  @Type(() => VitalSigns)
  vitalSigns: VitalSigns;

  @ApiProperty({
    description: 'Medical context and history',
    type: MedicalContext
  })
  @ValidateNested()
  @Type(() => MedicalContext)
  medicalContext: MedicalContext;

  @ApiProperty({
    description: 'Lifestyle factors affecting risk',
    type: LifestyleFactors
  })
  @ValidateNested()
  @Type(() => LifestyleFactors)
  lifestyleFactors: LifestyleFactors;

  @ApiProperty({
    description: 'Family medical history',
    type: FamilyHistory
  })
  @ValidateNested()
  @Type(() => FamilyHistory)
  familyHistory: FamilyHistory;

  @ApiProperty({
    description: 'Risk categories to assess',
    type: [String],
    enum: RiskCategory,
    example: [RiskCategory.CARDIOVASCULAR, RiskCategory.RESPIRATORY]
  })
  @IsArray()
  @IsEnum(RiskCategory, { each: true })
  riskCategories: RiskCategory[];

  @ApiProperty({
    description: 'Whether to include long-term risk projections',
    example: true
  })
  @IsBoolean()
  includeLongTermRisk: boolean;

  @ApiProperty({
    description: 'Additional notes or context',
    required: false,
    example: 'Patient reports high work stress'
  })
  @IsOptional()
  @IsString()
  notes?: string;
} 