import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { VitalSignsAssessment } from '@app/common';

export class VitalSignsDto {
  @ApiProperty({ description: 'Blood pressure reading', required: false })
  @IsString()
  @IsOptional()
  bloodPressure?: string;

  @ApiProperty({ description: 'Heart rate in BPM', required: false })
  @IsOptional()
  heartRate?: number;

  @ApiProperty({ description: 'Body temperature', required: false })
  @IsOptional()
  temperature?: number;

  @ApiProperty({ description: 'Respiratory rate', required: false })
  @IsOptional()
  respiratoryRate?: number;

  @ApiProperty({ description: 'Oxygen saturation level', required: false })
  @IsOptional()
  oxygenSaturation?: number;
}

export class QuestionnaireDto {
  @ApiProperty({ description: 'List of symptoms', type: [String] })
  @IsArray()
  @IsString({ each: true })
  symptoms!: string[];

  @ApiProperty({ description: 'Medical history', required: false })
  @IsString()
  @IsOptional()
  medicalHistory?: string;

  @ApiProperty({ description: 'Current medications', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  medications?: string[];

  @ApiProperty({ description: 'Known allergies', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergies?: string[];

  @ApiProperty({ description: 'Vital signs measurements', required: false })
  @IsObject()
  @ValidateNested()
  @Type(() => VitalSignsDto)
  @IsOptional()
  vitalSigns?: VitalSignsDto;
} 