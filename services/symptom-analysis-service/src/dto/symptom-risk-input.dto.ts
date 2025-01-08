import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class SymptomRiskInput {
  @ApiProperty({
    description: 'List of symptoms',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  public symptoms!: string[];

  @ApiProperty({
    description: 'Medical history',
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  public medicalHistory?: string;

  @ApiProperty({
    description: 'Severity level from 1-10',
    type: Number,
    minimum: 1,
    maximum: 10,
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  public severityLevel!: number;

  @ApiProperty({
    description: 'Patient age',
    required: false,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  public age?: number;
} 