import { ApiProperty } from '@nestjs/swagger';
import { MedicalReport, VitalSignsDto, RiskLevel, UrgencyLevel, Symptom } from '../interfaces/common';
import { IsString, IsNumber, IsArray, IsOptional, IsBoolean, ValidateNested, IsEnum, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class SymptomDto implements Symptom {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsNumber()
  severity!: number;

  @ApiProperty()
  @IsString()
  onset!: string;

  @ApiProperty()
  @IsString()
  duration!: string;
}

export class VitalSignsResponseDto implements VitalSignsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  heartRate?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  respiratoryRate?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  oxygenSaturation?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  bloodPressureSystolic?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  bloodPressureDiastolic?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ required: false, type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  findings?: number[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  requiresAttention?: boolean;
}

export class MedicalReportDto implements MedicalReport {
  @ApiProperty()
  @IsString()
  reportId!: string;

  @ApiProperty()
  @IsDate()
  timestamp!: Date;

  @ApiProperty()
  @IsString()
  patientId!: string;

  @ApiProperty({ type: [SymptomDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SymptomDto)
  symptoms!: Symptom[];

  @ApiProperty({ type: VitalSignsResponseDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => VitalSignsResponseDto)
  vitalSigns?: VitalSignsDto;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  diagnosis!: string[];

  @ApiProperty({ type: [String], example: ['Take medication as prescribed', 'Rest in dark room'] })
  @IsArray()
  @IsString({ each: true })
  recommendations!: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  followUpPlan!: string[];

  @ApiProperty({ enum: UrgencyLevel, example: UrgencyLevel.SOON, description: 'Urgency level of the case' })
  @IsEnum(UrgencyLevel)
  urgencyLevel!: UrgencyLevel;

  @ApiProperty({ enum: RiskLevel, example: RiskLevel.LOW, description: 'Risk level assessment' })
  @IsEnum(RiskLevel)
  riskLevel!: RiskLevel;

  @ApiProperty({ example: 0.85, description: 'Overall confidence in the assessment' })
  @IsNumber()
  confidence!: number;
} 