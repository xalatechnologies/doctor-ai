import { IsString, IsArray, IsOptional, ValidateNested, IsEnum, IsDate, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SymptomSeverity } from './adaptive-questionnaire.dto';

export class TimelineEvent {
  @ApiProperty({
    description: 'When the event occurred',
    example: '2024-01-20T10:30:00Z'
  })
  @IsDate()
  @Type(() => Date)
  timestamp: Date;

  @ApiProperty({
    description: 'Description of the symptom change or event',
    example: 'Pain intensity increased after physical activity'
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Current severity level',
    enum: SymptomSeverity,
    example: SymptomSeverity.MODERATE
  })
  @IsEnum(SymptomSeverity)
  severity: SymptomSeverity;

  @ApiProperty({
    description: 'Pain level on a scale of 0-10',
    example: 7,
    minimum: 0,
    maximum: 10
  })
  @IsNumber()
  @Min(0)
  @Max(10)
  painLevel: number;

  @ApiProperty({
    description: 'Factors that triggered or worsened the symptom',
    type: [String],
    required: false,
    example: ['exercise', 'stress']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  triggers?: string[];

  @ApiProperty({
    description: 'Factors that provided relief',
    type: [String],
    required: false,
    example: ['rest', 'medication']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alleviatingFactors?: string[];

  @ApiProperty({
    description: 'Whether medication was taken',
    example: true
  })
  @IsBoolean()
  medicationTaken: boolean;

  @ApiProperty({
    description: 'Medications taken if any',
    type: [String],
    required: false,
    example: ['ibuprofen 400mg']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medications?: string[];
}

export class SymptomTimelineInput {
  @ApiProperty({
    description: 'Unique identifier for the symptom being tracked',
    example: 'SYM-1234567'
  })
  @IsString()
  symptomId: string;

  @ApiProperty({
    description: 'Name of the symptom',
    example: 'headache'
  })
  @IsString()
  symptomName: string;

  @ApiProperty({
    description: 'Timeline event to add',
    type: TimelineEvent
  })
  @ValidateNested()
  @Type(() => TimelineEvent)
  event: TimelineEvent;

  @ApiProperty({
    description: 'Additional notes or observations',
    required: false,
    example: 'Symptom seems to worsen in the evening'
  })
  @IsOptional()
  @IsString()
  notes?: string;
} 