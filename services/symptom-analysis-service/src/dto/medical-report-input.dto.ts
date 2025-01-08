import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class SymptomInputDto {
  @ApiProperty({ description: 'Description of the symptom' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ description: 'Severity level of the symptom', required: false })
  @IsNumber()
  @IsOptional()
  severityLevel?: number;

  @ApiProperty({ description: 'Duration of the symptom' })
  @IsString()
  @IsNotEmpty()
  duration!: string;

  @ApiProperty({ description: 'When the symptom started' })
  @IsString()
  @IsNotEmpty()
  onset!: string;
}

export class VitalSignsInputDto {
  @ApiProperty({ description: 'Blood pressure reading', required: false })
  @IsString()
  @IsOptional()
  bloodPressure?: string;

  @ApiProperty({ description: 'Heart rate in BPM', required: false })
  @IsNumber()
  @IsOptional()
  heartRate?: number;

  @ApiProperty({ description: 'Body temperature', required: false })
  @IsNumber()
  @IsOptional()
  temperature?: number;

  @ApiProperty({ description: 'Respiratory rate', required: false })
  @IsNumber()
  @IsOptional()
  respiratoryRate?: number;

  @ApiProperty({ description: 'Oxygen saturation level', required: false })
  @IsNumber()
  @IsOptional()
  oxygenSaturation?: number;
}

export class MedicalReportInput {
  @ApiProperty({ description: 'Patient ID' })
  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @ApiProperty({ description: 'List of symptoms', type: [SymptomInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SymptomInputDto)
  symptoms!: SymptomInputDto[];

  @ApiProperty({ description: 'Vital signs measurements' })
  @ValidateNested()
  @Type(() => VitalSignsInputDto)
  vitalSigns!: VitalSignsInputDto;
} 