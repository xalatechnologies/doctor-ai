import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class MedicalHistoryRequestDto {
  @ApiProperty({ description: 'Start date for history search' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'End date for history search' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Type of medical records to retrieve' })
  @IsOptional()
  @IsString()
  type?: 'consultations' | 'diagnoses' | 'treatments' | 'all';
}

export class MedicalHistoryItemDto {
  @ApiProperty({ description: 'Date of the medical event' })
  date: string;

  @ApiProperty({ description: 'Type of medical record' })
  type: string;

  @ApiProperty({ description: 'Description of the medical event' })
  description: string;

  @ApiPropertyOptional({ description: 'Related diagnoses' })
  diagnoses?: string[];

  @ApiPropertyOptional({ description: 'Prescribed treatments' })
  treatments?: string[];

  @ApiPropertyOptional({ description: 'Follow-up recommendations' })
  followUp?: string[];
}

export class MedicalHistoryResponseDto {
  @ApiProperty({ description: 'Status of the request' })
  status: 'success' | 'error';

  @ApiProperty({
    description: 'Medical history records',
    type: [MedicalHistoryItemDto]
  })
  data: MedicalHistoryItemDto[];
} 