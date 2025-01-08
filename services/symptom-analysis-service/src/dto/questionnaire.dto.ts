import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsEnum, IsOptional } from 'class-validator';

export enum QuestionPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export class QuestionDto {
  @ApiProperty({ description: 'The question text' })
  @IsString()
  text: string = '';

  @ApiProperty({ description: 'The type of question (multiple choice, text, etc)' })
  @IsString()
  type: string = 'text';

  @ApiProperty({ description: 'Possible answers for multiple choice questions', required: false })
  @IsArray()
  @IsOptional()
  options?: string[];
}

export class QuestionnaireDto {
  @ApiProperty({ description: 'List of primary questions' })
  @IsArray()
  questions: QuestionDto[] = [];

  @ApiProperty({ description: 'List of follow-up questions based on initial responses' })
  @IsArray()
  followUpQuestions: QuestionDto[] = [];

  @ApiProperty({ enum: QuestionPriority, description: 'Priority level of the questionnaire' })
  @IsEnum(QuestionPriority)
  priority: QuestionPriority = QuestionPriority.LOW;
}

export class QuestionnaireResponseDto {
  @ApiProperty({ description: 'ID of the questionnaire' })
  @IsString()
  questionnaireId: string = '';

  @ApiProperty({ description: 'List of answers to the questions' })
  @IsArray()
  answers: Array<{
    question: string;
    answer: string;
  }> = [];
} 