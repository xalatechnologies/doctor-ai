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

export class AnalysisResultDto {
  @ApiProperty({ type: [DiagnosisDto] })
  diagnosis: DiagnosisDto[];

  @ApiProperty()
  confidence: number;

  @ApiProperty()
  recommendations: string[];

  @ApiProperty({ enum: ['immediate', 'urgent', 'semi-urgent', 'non-urgent'] })
  urgencyLevel: 'immediate' | 'urgent' | 'semi-urgent' | 'non-urgent';

  @ApiProperty()
  followUpRequired: boolean;
}

export class SymptomAnalysisResponseDto {
  @ApiProperty({ description: 'Status of the analysis' })
  status: 'success' | 'error';

  @ApiProperty({ type: AnalysisResultDto })
  data: AnalysisResultDto;
}