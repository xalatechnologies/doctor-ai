import { ApiProperty } from '@nestjs/swagger';

export class SymptomSuggestion {
  @ApiProperty({
    description: 'Unique identifier for the symptom suggestion',
    example: 'SYM-1234567'
  })
  id: string;

  @ApiProperty({
    description: 'Name of the symptom',
    example: 'headache'
  })
  name: string;

  @ApiProperty({
    description: 'Medical category of the symptom',
    example: 'Neurological'
  })
  category: string;

  @ApiProperty({
    description: 'Brief description of the symptom',
    example: 'Pain in the head or upper neck',
    required: false
  })
  description?: string;

  @ApiProperty({
    description: 'List of commonly associated symptoms',
    example: ['nausea', 'sensitivity to light', 'dizziness'],
    required: false,
    isArray: true,
    type: String
  })
  commonlyAssociated?: string[];
}

export class SymptomSuggestionResponse {
  @ApiProperty({
    description: 'List of symptom suggestions',
    type: [SymptomSuggestion],
    isArray: true
  })
  suggestions: SymptomSuggestion[];

  @ApiProperty({
    description: 'Total number of suggestions found',
    example: 3
  })
  totalCount: number;

  @ApiProperty({
    description: 'Original search query',
    example: 'head'
  })
  query: string;
} 