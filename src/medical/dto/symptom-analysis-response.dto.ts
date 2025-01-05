import { ApiProperty } from '@nestjs/swagger';

export class DiagnosisDto {
  @ApiProperty({ description: 'Name of the diagnosed condition' })
  condition: string;

  @ApiProperty({ description: 'Probability of the diagnosis', minimum: 0, maximum: 1 })
  probability: number;

  @ApiProperty({ description: 'Severity level of the condition', minimum: 1, maximum: 10 })
  severity: number;

  @ApiProperty({ description: 'Evidence supporting the diagnosis' })
  supportingEvidence: string[];

  @ApiProperty({ description: 'Alternative possible diagnoses' })
  differentialDiagnoses: string[];
}

export class SymptomAnalysisResponseDto {
  @ApiProperty({ description: 'Status of the analysis' })
  status: 'success' | 'error';

  @ApiProperty({
    description: 'Analysis results',
    type: () => ({
      diagnosis: [DiagnosisDto],
      confidence: Number,
      recommendations: [String],
      urgencyLevel: String,
      followUpRequired: Boolean
    })
  })
  data: {
    diagnosis: DiagnosisDto[];
    confidence: number;
    recommendations: string[];
    urgencyLevel: 'immediate' | 'urgent' | 'semi-urgent' | 'non-urgent';
    followUpRequired: boolean;
  };
} 