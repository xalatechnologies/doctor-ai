import { ApiProperty } from '@nestjs/swagger';
import { TimelineEvent } from '@dto/symptom-timeline.dto';
import { SymptomTrend } from './symptom-timeline.interface';

export class SymptomHistoryEntry {
  @ApiProperty({
    description: 'Unique identifier for the symptom',
    example: 'SYM-1234567'
  })
  symptomId: string;

  @ApiProperty({
    description: 'Name of the symptom',
    example: 'headache'
  })
  symptomName: string;

  @ApiProperty({
    description: 'When the symptom was first recorded',
    example: '2024-01-15T08:00:00Z'
  })
  firstRecorded: Date;

  @ApiProperty({
    description: 'When the symptom was last updated',
    example: '2024-01-20T14:30:00Z'
  })
  lastUpdated: Date;

  @ApiProperty({
    description: 'Current status of the symptom',
    example: 'ACTIVE',
    enum: ['ACTIVE', 'RESOLVED', 'CHRONIC']
  })
  status: 'ACTIVE' | 'RESOLVED' | 'CHRONIC';

  @ApiProperty({
    description: 'Timeline of recorded events',
    type: [TimelineEvent]
  })
  events: TimelineEvent[];

  @ApiProperty({
    description: 'Current trend analysis',
    type: SymptomTrend
  })
  trend: SymptomTrend;

  @ApiProperty({
    description: 'Total number of recorded events',
    example: 5
  })
  totalEvents: number;

  @ApiProperty({
    description: 'Whether the symptom currently requires attention',
    example: false
  })
  requiresAttention: boolean;
}

export class SymptomHistoryResponse {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: 'USR-1234567'
  })
  userId: string;

  @ApiProperty({
    description: 'List of all symptoms recorded for the user',
    type: [SymptomHistoryEntry]
  })
  symptoms: SymptomHistoryEntry[];

  @ApiProperty({
    description: 'Total number of symptoms recorded',
    example: 3
  })
  totalSymptoms: number;

  @ApiProperty({
    description: 'Number of active symptoms',
    example: 2
  })
  activeSymptoms: number;

  @ApiProperty({
    description: 'Number of symptoms requiring attention',
    example: 1
  })
  symptomsNeedingAttention: number;

  @ApiProperty({
    description: 'Most common symptoms experienced',
    type: [String],
    example: ['headache', 'back pain', 'fatigue']
  })
  commonSymptoms: string[];

  @ApiProperty({
    description: 'Most frequently identified triggers across all symptoms',
    type: [String],
    example: ['stress', 'lack of sleep', 'poor posture']
  })
  commonTriggers: string[];

  @ApiProperty({
    description: 'Most effective relief methods across all symptoms',
    type: [String],
    example: ['rest', 'medication', 'exercise']
  })
  effectiveReliefMethods: string[];
} 