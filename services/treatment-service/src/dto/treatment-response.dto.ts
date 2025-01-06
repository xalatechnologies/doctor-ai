import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TreatmentType, TreatmentPriority, TreatmentStatus } from '@interfaces/treatment.interface';
import { MedicationDto } from './medication.dto';
import { FollowUpScheduleDto } from './follow-up-schedule.dto';

export class TreatmentPlanResponseDto {
  @ApiProperty({
    description: 'Treatment plan ID',
    example: 'TRT-12345',
  })
  id: string;

  @ApiProperty({
    description: 'Patient ID',
    example: 'PAT-12345',
  })
  patientId: string;

  @ApiProperty({
    description: 'Type of treatment',
    enum: TreatmentType,
    example: TreatmentType.MEDICATION,
  })
  type: TreatmentType;

  @ApiProperty({
    description: 'Detailed description of the treatment plan',
    example: 'Daily medication regimen with physical therapy',
  })
  description: string;

  @ApiProperty({
    description: 'Priority level of the treatment',
    enum: TreatmentPriority,
    example: TreatmentPriority.HIGH,
  })
  priority: TreatmentPriority;

  @ApiPropertyOptional({
    description: 'List of medications',
    type: [MedicationDto],
  })
  medications?: MedicationDto[];

  @ApiProperty({
    description: 'Treatment instructions',
    type: [String],
    example: ['Take medication with food', 'Rest for 24 hours'],
  })
  instructions: string[];

  @ApiPropertyOptional({
    description: 'Treatment precautions',
    type: [String],
    example: ['Avoid strenuous activity', 'Monitor for allergic reactions'],
  })
  precautions?: string[];

  @ApiPropertyOptional({
    description: 'Treatment contraindications',
    type: [String],
    example: ['Pregnancy', 'Heart conditions'],
  })
  contraindications?: string[];

  @ApiProperty({
    description: 'Duration of treatment in days',
    example: 14,
    minimum: 1,
  })
  duration: number;

  @ApiProperty({
    description: 'Frequency of treatment',
    example: 'Once daily',
  })
  frequency: string;

  @ApiProperty({
    description: 'Treatment status',
    enum: TreatmentStatus,
    example: TreatmentStatus.IN_PROGRESS,
  })
  status: TreatmentStatus;

  @ApiProperty({
    description: 'Start date of treatment',
    example: '2024-01-01',
  })
  startDate: string;

  @ApiPropertyOptional({
    description: 'End date of treatment',
    example: '2024-01-14',
  })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Follow-up schedule',
    type: [FollowUpScheduleDto],
  })
  followUpSchedule?: FollowUpScheduleDto[];

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T12:00:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T12:00:00Z',
  })
  updatedAt: string;
}

export class TreatmentProgressResponseDto {
  @ApiProperty({
    description: 'Progress record ID',
    example: 'PRG-12345',
  })
  id: string;

  @ApiProperty({
    description: 'Treatment plan ID',
    example: 'TRT-12345',
  })
  treatmentPlanId: string;

  @ApiProperty({
    description: 'Progress date',
    example: '2024-01-01',
  })
  date: string;

  @ApiPropertyOptional({
    description: 'Progress notes',
    example: 'Patient showing improvement',
  })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Clinical observations',
    type: [String],
    example: ['Reduced pain', 'Better mobility'],
  })
  observations?: string[];

  @ApiPropertyOptional({
    description: 'Complications encountered',
    type: [String],
    example: ['Mild nausea'],
  })
  complications?: string[];

  @ApiPropertyOptional({
    description: 'Treatment adjustments made',
    type: [String],
    example: ['Reduced medication dosage'],
  })
  adjustments?: string[];

  @ApiProperty({
    description: 'Treatment status',
    enum: TreatmentStatus,
    example: TreatmentStatus.IN_PROGRESS,
  })
  status: TreatmentStatus;

  @ApiPropertyOptional({
    description: 'Next checkup date',
    example: '2024-01-15',
  })
  nextCheckupDate?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T12:00:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T12:00:00Z',
  })
  updatedAt: string;
} 