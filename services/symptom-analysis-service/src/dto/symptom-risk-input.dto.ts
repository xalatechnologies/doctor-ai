import { IsArray, IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SymptomRiskInput {
  @ApiProperty({ description: 'List of symptoms' })
  @IsArray()
  @IsString({ each: true })
  symptoms: string[];

  @ApiProperty({ description: 'Severity level from 1-10' })
  @IsNumber()
  @Min(1)
  @Max(10)
  severityLevel: number;

  @ApiProperty({ description: 'Medical history', required: false })
  @IsOptional()
  @IsString()
  medicalHistory?: string;

  @ApiProperty({ description: 'Current medications', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medications?: string[];
} 