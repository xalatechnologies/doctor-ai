import { ApiProperty } from '@nestjs/swagger';
import { TimelineEvent } from '@dto/symptom-timeline.dto';

export class SymptomTrend {
  @ApiProperty({
    description: 'Overall trend of the symptom',
    example: 'IMPROVING',
    enum: ['IMPROVING', 'WORSENING', 'STABLE', 'FLUCTUATING']
  })
  trend: 'IMPROVING' | 'WORSENING' | 'STABLE' | 'FLUCTUATING';

  @ApiProperty({
    description: 'Average pain level over the last 24 hours',
    example: 6.5
  })
  averagePainLevel: number;

  @ApiProperty({
    description: 'Most common triggers identified',
    type: [String],
    example: ['stress', 'lack of sleep']
  })
  commonTriggers: string[];

  @ApiProperty({
    description: 'Most effective alleviating factors',
    type: [String],
    example: ['rest', 'medication']
  })
  effectiveRelief: string[];

  @ApiProperty({
    description: 'Time periods when symptoms are typically worse',
    type: [String],
    example: ['evening', 'after exercise']
  })
  peakTimes: string[];
}

export class SymptomTimelineResponse {
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
    description: 'Latest timeline event',
    type: TimelineEvent
  })
  latestEvent: TimelineEvent;

  @ApiProperty({
    description: 'Analysis of symptom trends',
    type: SymptomTrend
  })
  trend: SymptomTrend;

  @ApiProperty({
    description: 'Total number of recorded events',
    example: 5
  })
  totalEvents: number;

  @ApiProperty({
    description: 'Whether the symptom requires immediate medical attention',
    example: false
  })
  requiresAttention: boolean;

  @ApiProperty({
    description: 'Recommendations based on the timeline analysis',
    type: [String],
    example: [
      'Consider keeping a sleep diary',
      'Avoid identified triggers',
      'Continue with effective medications'
    ]
  })
  recommendations: string[];
} 