import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssessEmergencyDto {
  @ApiProperty({ description: 'Main symptoms or emergency situation description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Patient age' })
  @IsString()
  @IsNotEmpty()
  age: string;

  @ApiPropertyOptional({ description: 'Existing medical conditions', type: [String] })
  @IsArray()
  @IsOptional()
  existingConditions?: string[];

  @ApiPropertyOptional({ description: 'Current medications', type: [String] })
  @IsArray()
  @IsOptional()
  medications?: string[];

  @ApiPropertyOptional({ description: 'Additional context or notes' })
  @IsString()
  @IsOptional()
  additionalNotes?: string;
} 