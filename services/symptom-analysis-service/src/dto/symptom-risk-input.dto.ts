import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsArray,
  IsOptional,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  IsNotEmpty
} from 'class-validator';

export class Symptom {
  @ApiProperty({
    description: 'Name of the symptom',
    example: 'chest pain'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Severity of the symptom',
    example: 'moderate'
  })
  @IsString()
  @IsNotEmpty()
  severity: string;

  @ApiProperty({
    description: 'Duration of the symptom',
    example: '3 days'
  })
  @IsString()
  @IsNotEmpty()
  duration: string;

  @ApiProperty({
    description: 'Additional details about the symptom',
    example: 'Sharp pain, worse with movement',
    required: false
  })
  @IsOptional()
  @IsString()
  details?: string;
}

export class VitalSigns {
  @ApiProperty({
    description: 'Blood pressure reading (systolic/diastolic)',
    example: '120/80',
    required: false
  })
  @IsOptional()
  @IsString()
  bloodPressure?: string;

  @ApiProperty({
    description: 'Heart rate in beats per minute',
    example: 72,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  heartRate?: number;

  @ApiProperty({
    description: 'Body temperature in Celsius',
    example: 37.2,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(45)
  temperature?: number;

  @ApiProperty({
    description: 'Respiratory rate in breaths per minute',
    example: 16,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  respiratoryRate?: number;

  @ApiProperty({
    description: 'Blood oxygen saturation percentage',
    example: 98,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  oxygenSaturation?: number;
}

export class SymptomRiskInput {
  @ApiProperty({
    description: 'List of symptoms to analyze',
    type: [Symptom]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Symptom)
  symptoms: Symptom[];

  @ApiProperty({
    description: 'Vital signs measurements',
    type: VitalSigns,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => VitalSigns)
  vitalSigns?: VitalSigns;

  @ApiProperty({
    description: 'Relevant medical history',
    type: [String],
    example: ['Hypertension', 'Type 2 Diabetes'],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medicalHistory?: string[];

  @ApiProperty({
    description: 'Current medications',
    type: [String],
    example: ['Metformin 1000mg daily', 'Lisinopril 10mg daily'],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medications?: string[];

  @ApiProperty({
    description: 'Known allergies',
    type: [String],
    example: ['Penicillin', 'Sulfa drugs'],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];
} 