import { IsString, IsNumber, IsEnum, IsArray, IsOptional, Min, Max, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TreatmentType, TreatmentPriority } from '@interfaces/treatment.interface';

export class CreateTreatmentDto {
  @ApiProperty({
    description: 'Patient ID',
    example: 'PAT-12345',
  })
  @IsString()
  patientId: string;

  @ApiProperty({
    description: 'Type of treatment',
    enum: TreatmentType,
    example: TreatmentType.MEDICATION,
  })
  @IsEnum(TreatmentType)
  type: TreatmentType;

  @ApiProperty({
    description: 'Detailed description of the treatment plan',
    example: 'Daily medication regimen with physical therapy',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Priority level of the treatment',
    enum: TreatmentPriority,
    example: TreatmentPriority.HIGH,
  })
  @IsEnum(TreatmentPriority)
  priority: TreatmentPriority;

  @ApiPropertyOptional({
    description: 'List of prescribed medications',
    type: [String],
    example: ['Amoxicillin 500mg', 'Ibuprofen 400mg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medications?: string[];

  @ApiProperty({
    description: 'Treatment instructions',
    type: [String],
    example: ['Take medication with food', 'Rest for 24 hours'],
  })
  @IsArray()
  @IsString({ each: true })
  instructions: string[];

  @ApiPropertyOptional({
    description: 'Precautions to be taken',
    type: [String],
    example: ['Avoid strenuous activity', 'Monitor for allergic reactions'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  precautions?: string[];

  @ApiPropertyOptional({
    description: 'Contraindications for the treatment',
    type: [String],
    example: ['Pregnancy', 'Heart conditions'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contraindications?: string[];

  @ApiProperty({
    description: 'Duration of treatment in days',
    minimum: 1,
    example: 14,
  })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiProperty({
    description: 'Frequency of treatment',
    example: 'Twice daily',
  })
  @IsString()
  frequency: string;

  @ApiProperty({
    description: 'Start date of treatment',
    example: '2024-01-15T00:00:00Z',
  })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({
    description: 'End date of treatment',
    example: '2024-01-29T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
} 