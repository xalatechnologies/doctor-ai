import { IsString, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FollowUpScheduleDto {
  @ApiProperty({
    description: 'Date of follow-up',
    example: '2024-01-15',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Type of follow-up',
    example: 'Check-up',
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Healthcare provider',
    example: 'Dr. Smith',
  })
  @IsString()
  provider: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Bring test results',
  })
  @IsOptional()
  @IsString()
  notes?: string;
} 