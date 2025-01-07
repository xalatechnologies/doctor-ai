import { ApiProperty } from '@nestjs/swagger';

export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  SCALE = 'SCALE',
  TEXT = 'TEXT'
}

export class QuestionOption {
  @ApiProperty({
    description: 'Unique identifier for the option',
    example: 'OPT-1'
  })
  id: string;

  @ApiProperty({
    description: 'The text of the option',
    example: 'Yes'
  })
  text: string;

  @ApiProperty({
    description: 'Additional information about the option',
    example: 'Select if the pain is constant',
    required: false
  })
  description?: string;
}

export class AdaptiveQuestion {
  @ApiProperty({
    description: 'Unique identifier for the question',
    example: 'Q-1234'
  })
  id: string;

  @ApiProperty({
    description: 'The question text',
    example: 'Is the pain constant or intermittent?'
  })
  text: string;

  @ApiProperty({
    description: 'The type of question',
    enum: QuestionType,
    example: QuestionType.SINGLE_CHOICE
  })
  type: QuestionType;

  @ApiProperty({
    description: 'Available options for the question',
    type: [QuestionOption],
    required: false
  })
  options?: QuestionOption[];

  @ApiProperty({
    description: 'Additional context or instructions for the question',
    example: 'Please select the option that best describes your pain pattern',
    required: false
  })
  context?: string;

  @ApiProperty({
    description: 'Whether this question is required to be answered',
    example: true
  })
  required: boolean;
}

export class AdaptiveQuestionnaireResponse {
  @ApiProperty({
    description: 'Unique identifier for the questionnaire session',
    example: 'QUEST-1234567'
  })
  sessionId: string;

  @ApiProperty({
    description: 'List of follow-up questions',
    type: [AdaptiveQuestion]
  })
  questions: AdaptiveQuestion[];

  @ApiProperty({
    description: 'The category of symptoms being assessed',
    example: 'Neurological'
  })
  category: string;

  @ApiProperty({
    description: 'Estimated time to complete in minutes',
    example: 5
  })
  estimatedTimeMinutes: number;

  @ApiProperty({
    description: 'Progress in the questionnaire (0-100)',
    example: 25
  })
  progress: number;
} 