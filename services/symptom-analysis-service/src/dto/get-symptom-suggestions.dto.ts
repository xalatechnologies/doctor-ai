import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetSymptomSuggestionsDto {
  @ApiProperty({
    description: 'The text query to get symptom suggestions for',
    example: 'head',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  query: string;
} 