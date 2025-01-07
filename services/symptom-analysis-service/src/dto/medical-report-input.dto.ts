import { IsString, IsArray, IsObject, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class BloodPressureDto {
  @ApiProperty({ description: 'Systolic blood pressure' })
  @IsNumber()
  systolic: number;

  @ApiProperty({ description: 'Diastolic blood pressure' })
  @IsNumber()
  diastolic: number;
}

export class SymptomInputDto {
  @ApiProperty({ description: 'Description of the symptom' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Severity level of the symptom' })
  @IsNumber()
  severity: number;

  @ApiProperty({ description: 'Duration of the symptom' })
  @IsString()
  duration: string;

  @ApiProperty({ description: 'When the symptom started' })
  @IsString()
  onset: string;

  @ApiProperty({ description: 'Location of the symptom', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Characteristics of the symptom', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  characteristics?: string[];

  @ApiProperty({ description: 'Severity level from 1-10', required: false })
  @IsNumber()
  @IsOptional()
  severityLevel?: number;
}

export class VitalSignsInputDto {
  @ApiProperty({ description: 'Body temperature in Celsius' })
  @IsNumber()
  temperature: number;

  @ApiProperty({ description: 'Heart rate in beats per minute' })
  @IsNumber()
  heartRate: number;

  @ApiProperty({ description: 'Blood pressure readings' })
  @IsObject()
  @ValidateNested()
  @Type(() => BloodPressureDto)
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };

  @ApiProperty({ description: 'Respiratory rate in breaths per minute' })
  @IsNumber()
  respiratoryRate: number;

  @ApiProperty({ description: 'Oxygen saturation percentage' })
  @IsNumber()
  oxygenSaturation: number;
}

export class MedicalReportInput {
  @ApiProperty({ description: 'Patient identifier' })
  @IsString()
  patientId: string;

  @ApiProperty({ description: 'List of symptoms', type: [SymptomInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SymptomInputDto)
  symptoms: SymptomInputDto[];

  @ApiProperty({ description: 'Vital signs measurements' })
  @IsObject()
  @ValidateNested()
  @Type(() => VitalSignsInputDto)
  vitalSigns: VitalSignsInputDto;
} 