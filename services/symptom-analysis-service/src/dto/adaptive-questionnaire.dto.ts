import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsArray, IsOptional } from 'class-validator';

export enum SymptomSeverity {
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
  CRITICAL = 'CRITICAL'
}

export class AdaptiveQuestionnaireInput {
  @ApiProperty({
    description: 'Primary symptom or complaint',
    example: 'chest pain'
  })
  @IsString()
  primarySymptom: string;

  @ApiProperty({
    description: 'Severity of the primary symptom',
    enum: SymptomSeverity,
    example: SymptomSeverity.MODERATE
  })
  @IsEnum(SymptomSeverity)
  severity: SymptomSeverity;

  @ApiProperty({
    description: 'Additional symptoms or observations',
    type: [String],
    required: false,
    example: ['shortness of breath', 'fatigue']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalSymptoms?: string[];
} 