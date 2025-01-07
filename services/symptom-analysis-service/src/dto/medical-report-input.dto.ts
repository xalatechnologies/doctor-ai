import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsArray, IsOptional, IsNotEmpty, ValidateNested, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum SymptomSeverity {
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
  CRITICAL = 'CRITICAL'
}

export enum ReportType {
  INITIAL_ASSESSMENT = 'INITIAL_ASSESSMENT',
  FOLLOW_UP = 'FOLLOW_UP',
  EMERGENCY = 'EMERGENCY',
  SPECIALIST_REFERRAL = 'SPECIALIST_REFERRAL',
  DISCHARGE = 'DISCHARGE'
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

export class SymptomDetail {
  @ApiProperty({
    description: 'Name of the symptom',
    example: 'chest pain'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Severity level of the symptom',
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

  @ApiProperty({
    description: 'Associated symptoms or conditions',
    type: [String],
    example: ['shortness of breath', 'sweating'],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  associatedSymptoms?: string[];
}

export class MedicalReportInput {
  @ApiProperty({
    description: 'Patient identifier',
    example: 'PAT-123456'
  })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({
    description: 'Type of medical report',
    enum: ReportType,
    example: ReportType.INITIAL_ASSESSMENT
  })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({
    description: 'Primary symptoms reported by the patient',
    type: [SymptomDetail]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SymptomDetail)
  symptoms: SymptomDetail[];

  @ApiProperty({
    description: 'Vital signs measurements',
    type: VitalSigns
  })
  @ValidateNested()
  @Type(() => VitalSigns)
  vitalSigns: VitalSigns;

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

  @ApiProperty({
    description: 'Additional notes or observations',
    example: 'Patient appears anxious and in mild distress',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;
} 