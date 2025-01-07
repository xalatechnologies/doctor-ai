import { IsString, IsArray, IsOptional, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum SymptomSeverity {
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE'
}

export class SymptomInput {
  @ApiProperty({
    description: 'The name of the symptom',
    example: 'headache'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The severity level of the symptom',
    enum: SymptomSeverity,
    example: SymptomSeverity.MODERATE
  })
  @IsEnum(SymptomSeverity)
  severity: SymptomSeverity;

  @ApiProperty({
    description: 'Duration of the symptom',
    example: '3 days'
  })
  @IsString()
  duration: string;
}

export class AdaptiveQuestionnaireInput {
  @ApiProperty({
    description: 'Primary symptom information',
    type: SymptomInput
  })
  @ValidateNested()
  @Type(() => SymptomInput)
  primarySymptom: SymptomInput;

  @ApiProperty({
    description: 'Additional symptoms information',
    type: [SymptomInput],
    required: false
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SymptomInput)
  secondarySymptoms?: SymptomInput[];

  @ApiProperty({
    description: 'Previous answers to questions if any',
    type: [String],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  previousAnswers?: string[];
} 