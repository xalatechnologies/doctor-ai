import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNumber, IsOptional } from 'class-validator';

export class SymptomRiskInput {
  @ApiProperty({ description: 'List of symptoms' })
  @IsArray()
  @IsString({ each: true })
  symptoms: string[];

  @ApiProperty({ description: 'Medical history', required: false })
  @IsString()
  @IsOptional()
  medicalHistory?: string;

  @ApiProperty({ description: 'Severity level from 1-10' })
  @IsNumber()
  severityLevel: number;

  @ApiProperty({ description: 'Patient age', required: false })
  @IsNumber()
  @IsOptional()
  age?: number;
} 