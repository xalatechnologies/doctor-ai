import { IsString, IsArray, IsOptional, ValidateNested, IsEnum, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SymptomSeverity } from './adaptive-questionnaire.dto';

export class VitalSigns {
  @ApiProperty({
    description: 'Body temperature in Celsius',
    example: 37.5,
    minimum: 35,
    maximum: 42
  })
  @IsNumber()
  @Min(35)
  @Max(42)
  temperature: number;

  @ApiProperty({
    description: 'Heart rate in beats per minute',
    example: 75,
    minimum: 40,
    maximum: 200
  })
  @IsNumber()
  @Min(40)
  @Max(200)
  heartRate: number;

  @ApiProperty({
    description: 'Blood pressure systolic',
    example: 120,
    minimum: 70,
    maximum: 200
  })
  @IsNumber()
  @Min(70)
  @Max(200)
  bloodPressureSystolic: number;

  @ApiProperty({
    description: 'Blood pressure diastolic',
    example: 80,
    minimum: 40,
    maximum: 130
  })
  @IsNumber()
  @Min(40)
  @Max(130)
  bloodPressureDiastolic: number;

  @ApiProperty({
    description: 'Oxygen saturation percentage',
    example: 98,
    minimum: 70,
    maximum: 100
  })
  @IsNumber()
  @Min(70)
  @Max(100)
  oxygenSaturation: number;
}

export class MedicalContext {
  @ApiProperty({
    description: 'List of current medications',
    type: [String],
    required: false,
    example: ['metformin 500mg', 'lisinopril 10mg']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  currentMedications?: string[];

  @ApiProperty({
    description: 'List of known allergies',
    type: [String],
    required: false,
    example: ['penicillin', 'peanuts']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiProperty({
    description: 'List of chronic conditions',
    type: [String],
    required: false,
    example: ['type 2 diabetes', 'hypertension']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  chronicConditions?: string[];

  @ApiProperty({
    description: 'Recent relevant medical procedures or events',
    type: [String],
    required: false,
    example: ['appendectomy 2 months ago']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recentProcedures?: string[];
}

export class SymptomDetail {
  @ApiProperty({
    description: 'Name of the symptom',
    example: 'chest pain'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Detailed description of the symptom',
    example: 'Sharp pain in the center of chest, worse with deep breathing'
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Duration of the symptom',
    example: '2 hours'
  })
  @IsString()
  duration: string;

  @ApiProperty({
    description: 'Severity level of the symptom',
    enum: SymptomSeverity,
    example: SymptomSeverity.MODERATE
  })
  @IsEnum(SymptomSeverity)
  severity: SymptomSeverity;

  @ApiProperty({
    description: 'Factors that worsen the symptom',
    type: [String],
    required: false,
    example: ['physical activity', 'deep breathing']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aggravatingFactors?: string[];

  @ApiProperty({
    description: 'Factors that provide relief',
    type: [String],
    required: false,
    example: ['rest', 'sitting upright']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relievingFactors?: string[];
}

export class SymptomAnalysisInput {
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
    description: 'Whether this is an emergency situation',
    example: false
  })
  @IsBoolean()
  isEmergency: boolean;

  @ApiProperty({
    description: 'Additional notes or observations',
    required: false,
    example: 'Symptoms started after eating at a restaurant'
  })
  @IsOptional()
  @IsString()
  notes?: string;
} 