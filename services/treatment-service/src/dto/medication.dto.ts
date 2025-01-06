import { IsString, IsNumber, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MedicationDto {
  @ApiProperty({
    description: 'Name of the medication',
    example: 'Amoxicillin',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Dosage of the medication',
    example: '500mg',
  })
  @IsString()
  dosage: string;

  @ApiProperty({
    description: 'Frequency of medication',
    example: 'Twice daily',
  })
  @IsString()
  frequency: string;

  @ApiProperty({
    description: 'Duration of medication in days',
    example: 7,
    minimum: 1,
  })
  @IsNumber()
  duration: number;

  @ApiProperty({
    description: 'Instructions for taking medication',
    type: [String],
    example: ['Take with food', 'Avoid alcohol'],
  })
  @IsArray()
  @IsString({ each: true })
  instructions: string[];

  @ApiPropertyOptional({
    description: 'Possible side effects',
    type: [String],
    example: ['Nausea', 'Dizziness'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sideEffects?: string[];
} 