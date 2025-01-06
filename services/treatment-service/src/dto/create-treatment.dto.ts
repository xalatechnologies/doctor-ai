import { IsString, IsNumber, IsEnum, IsArray, IsOptional, Min, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TreatmentType, TreatmentPriority } from '@interfaces/treatment.interface';
import { MedicationDto } from './medication.dto';
import { FollowUpScheduleDto } from './follow-up-schedule.dto';

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
    description: 'List of medications',
    type: [MedicationDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationDto)
  medications?: MedicationDto[];

  @ApiProperty({
    description: 'Treatment instructions',
    type: [String],
    example: ['Take medication with food', 'Rest for 24 hours'],
  })
  @IsArray()
  @IsString({ each: true })
  instructions: string[];

  @ApiPropertyOptional({
    description: 'Treatment precautions',
    type: [String],
    example: ['Avoid strenuous activity', 'Monitor for allergic reactions'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  precautions?: string[];

  @ApiPropertyOptional({
    description: 'Treatment contraindications',
    type: [String],
    example: ['Pregnancy', 'Heart conditions'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contraindications?: string[];

  @ApiProperty({
    description: 'Duration of treatment in days',
    example: 14,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiProperty({
    description: 'Frequency of treatment',
    example: 'Once daily',
  })
  @IsString()
  frequency: string;

  @ApiProperty({
    description: 'Start date of treatment',
    example: '2024-01-01',
  })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({
    description: 'End date of treatment',
    example: '2024-01-14',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Follow-up schedule',
    type: [FollowUpScheduleDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FollowUpScheduleDto)
  followUpSchedule?: FollowUpScheduleDto[];
} 