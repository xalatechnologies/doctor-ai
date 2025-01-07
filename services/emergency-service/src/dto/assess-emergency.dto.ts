import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class AssessEmergencyDto {
  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString()
  primarySymptom: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  secondarySymptoms?: string[];
} 