import { IsString, IsEnum, IsArray, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TreatmentStatus } from '@interfaces/treatment.interface';

export class UpdateTreatmentProgressDto {
  @ApiProperty({
    description: 'Progress notes',
    example: 'Patient showing improvement in symptoms',
  })
  @IsString()
  notes: string;

  @ApiPropertyOptional({
    description: 'Clinical observations',
    type: [String],
    example: ['Reduced pain levels', 'Improved mobility'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  observations?: string[];

  @ApiPropertyOptional({
    description: 'Any complications encountered',
    type: [String],
    example: ['Mild nausea', 'Temporary dizziness'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  complications?: string[];

  @ApiPropertyOptional({
    description: 'Adjustments made to the treatment plan',
    type: [String],
    example: ['Reduced medication dosage', 'Modified exercise routine'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  adjustments?: string[];

  @ApiProperty({
    description: 'Current status of the treatment',
    enum: TreatmentStatus,
    example: TreatmentStatus.IN_PROGRESS,
  })
  @IsEnum(TreatmentStatus)
  status: TreatmentStatus;

  @ApiProperty({
    description: 'Date of next checkup',
    example: '2024-01-22T10:00:00Z',
  })
  @IsDateString()
  nextCheckupDate: string;
} 