import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class AnalyzeSymptomDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  primarySymptom: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  secondarySymptoms?: string[];

  @IsNumber()
  @Min(0)
  @Max(10)
  @Type(() => Number)
  painLevel: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  @Type(() => Number)
  severityLevel: number;

  @IsString()
  @IsNotEmpty()
  duration: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  triggers?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  alleviatingFactors?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  aggravatingFactors?: string[];

  @IsString()
  @IsOptional()
  patientHistory?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  currentMedications?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergies?: string[];
} 