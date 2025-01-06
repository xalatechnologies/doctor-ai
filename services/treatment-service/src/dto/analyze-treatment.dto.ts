import { IsString, IsNumber, IsArray, IsOptional, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TreatmentCategory {
  MEDICATION = 'MEDICATION',
  PHYSICAL_THERAPY = 'PHYSICAL_THERAPY',
  SURGERY = 'SURGERY',
  MENTAL_HEALTH = 'MENTAL_HEALTH',
  CHRONIC_CARE = 'CHRONIC_CARE',
}

export class AnalyzeTreatmentDto {
  @ApiProperty({
    example: 'Chronic lower back pain requiring physical therapy',
    description: 'Detailed description of the condition requiring treatment',
  })
  @IsString()
  description: string;

  @ApiProperty({
    enum: TreatmentCategory,
    example: TreatmentCategory.PHYSICAL_THERAPY,
    description: 'Category of the treatment',
  })
  @IsEnum(TreatmentCategory)
  category: TreatmentCategory;

  @ApiProperty({
    example: 'Lower back pain',
    description: 'Primary condition requiring treatment',
  })
  @IsString()
  primaryCondition: string;

  @ApiProperty({
    example: ['Muscle weakness', 'Limited mobility'],
    description: 'Secondary conditions that may affect treatment',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  secondaryConditions?: string[];

  @ApiProperty({
    example: 7,
    description: 'Severity level of the condition (0-10)',
  })
  @IsNumber()
  @Min(0)
  @Max(10)
  severityLevel: number;

  @ApiProperty({
    example: 6,
    description: 'Complexity level of the treatment (0-10)',
  })
  @IsNumber()
  @Min(0)
  @Max(10)
  complexityLevel: number;

  @ApiProperty({
    example: 'chronic',
    description: 'Duration or chronicity of the condition',
  })
  @IsString()
  duration: string;

  @ApiProperty({
    example: ['Prolonged sitting', 'Heavy lifting'],
    description: 'Factors that complicate the treatment',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  complicatingFactors?: string[];

  @ApiProperty({
    example: ['Exercise', 'Heat therapy'],
    description: 'Factors that improve the condition',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  improvingFactors?: string[];

  @ApiProperty({
    example: ['Previous back surgery', 'Arthritis'],
    description: 'Relevant medical history',
    required: false,
  })
  @IsOptional()
  @IsString()
  medicalHistory?: string;

  @ApiProperty({
    example: ['Pain medication', 'Muscle relaxants'],
    description: 'Current medications being taken',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  currentMedications?: string[];

  @ApiProperty({
    example: ['NSAIDs', 'Latex'],
    description: 'Known allergies',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiProperty({
    example: ['Previous physical therapy', 'Home exercises'],
    description: 'Previous treatments attempted',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  previousTreatments?: string[];

  @ApiProperty({
    example: ['Pain reduction', 'Improved mobility'],
    description: 'Treatment goals',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  treatmentGoals?: string[];
} 