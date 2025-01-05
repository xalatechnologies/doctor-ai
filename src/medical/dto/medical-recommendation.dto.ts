import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MedicalRecommendationRequestDto {
  @ApiProperty({ description: 'Medical condition or symptom to get recommendations for' })
  @IsString()
  condition: string;

  @ApiPropertyOptional({ description: 'Specific type of recommendations to filter' })
  @IsOptional()
  @IsString()
  type?: 'lifestyle' | 'medication' | 'followup' | 'prevention';

  @ApiPropertyOptional({ description: 'Patient age for age-specific recommendations' })
  @IsOptional()
  @IsString()
  ageGroup?: string;
}

export class RecommendationItemDto {
  @ApiProperty({ description: 'Type of recommendation' })
  type: string;

  @ApiProperty({ description: 'Detailed recommendation text' })
  description: string;

  @ApiProperty({ description: 'Priority level of the recommendation' })
  priority: number;

  @ApiPropertyOptional({ description: 'Timeframe for the recommendation' })
  timeframe?: string;

  @ApiPropertyOptional({ description: 'Additional notes or precautions' })
  notes?: string[];
}

export class MedicalRecommendationResponseDto {
  @ApiProperty({ description: 'Status of the request' })
  status: 'success' | 'error';

  @ApiProperty({
    description: 'List of recommendations',
    type: [RecommendationItemDto]
  })
  @ValidateNested({ each: true })
  @Type(() => RecommendationItemDto)
  data: RecommendationItemDto[];
} 