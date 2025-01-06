import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyzeSymptomDto {
  @ApiProperty({
    example: 'Severe chest pain with shortness of breath',
    description: 'Detailed description of the symptoms',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @ApiProperty({
    example: 'chest pain',
    description: 'Main symptom that the patient is experiencing',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-zA-Z\s-]+$/, {
    message: 'Primary symptom should only contain letters, spaces, and hyphens',
  })
  primarySymptom: string;

  @ApiPropertyOptional({
    example: ['shortness of breath', 'dizziness'],
    description: 'Additional symptoms that may be related',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(10)
  @MaxLength(100, { each: true })
  secondarySymptoms?: string[];

  @ApiProperty({
    example: 8,
    description: 'Pain level on a scale of 0-10',
    minimum: 0,
    maximum: 10,
  })
  @IsNumber()
  @Min(0)
  @Max(10)
  @Type(() => Number)
  painLevel: number;

  @ApiProperty({
    example: 7,
    description: 'Overall severity level on a scale of 0-10',
    minimum: 0,
    maximum: 10,
  })
  @IsNumber()
  @Min(0)
  @Max(10)
  @Type(() => Number)
  severityLevel: number;

  @ApiProperty({
    example: 'acute',
    description: 'Duration of the symptoms (e.g., acute, chronic, days, weeks)',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  duration: string;

  @ApiPropertyOptional({
    example: ['stress', 'physical activity'],
    description: 'Factors that trigger or worsen the symptoms',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(10)
  @MaxLength(100, { each: true })
  triggers?: string[];

  @ApiPropertyOptional({
    example: ['rest', 'medication'],
    description: 'Factors that help reduce the symptoms',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(10)
  @MaxLength(100, { each: true })
  alleviatingFactors?: string[];

  @ApiPropertyOptional({
    example: ['movement', 'eating'],
    description: 'Factors that make the symptoms worse',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(10)
  @MaxLength(100, { each: true })
  aggravatingFactors?: string[];

  @ApiPropertyOptional({
    example: 'hypertension, diabetes',
    description: 'Relevant medical history',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  patientHistory?: string;

  @ApiPropertyOptional({
    example: ['aspirin', 'insulin'],
    description: 'Current medications being taken',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(20)
  @MaxLength(100, { each: true })
  currentMedications?: string[];

  @ApiPropertyOptional({
    example: ['penicillin', 'latex'],
    description: 'Known allergies',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(20)
  @MaxLength(100, { each: true })
  allergies?: string[];
} 