import { IsArray, IsNumber, IsOptional, IsString, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PrimarySymptomDto {
  @ApiProperty({
    description: 'Name of the symptom',
    example: 'chest_pain',
    required: true
  })
  @IsString()
  symptom: string;

  @ApiProperty({
    description: 'Severity level from 1-10',
    minimum: 1,
    maximum: 10,
    example: 7,
    required: true
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  severity: number;

  @ApiProperty({
    description: 'Duration of the symptom',
    example: '2 hours',
    required: true
  })
  @IsString()
  duration: string;

  @ApiProperty({
    description: 'Frequency of the symptom',
    example: 'constant',
    required: true
  })
  @IsString()
  frequency: string;

  @ApiProperty({
    description: 'Characteristics of the symptom',
    example: ['sharp', 'radiating', 'worse with movement'],
    required: true,
    isArray: true,
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  characteristics: string[];
}

export class VitalSignsDto {
  @ApiPropertyOptional({
    description: 'Blood pressure in format systolic/diastolic',
    example: '120/80',
    pattern: '^\\d{2,3}\\/\\d{2,3}$'
  })
  @IsOptional()
  @IsString()
  bloodPressure?: string;

  @ApiPropertyOptional({
    description: 'Heart rate in beats per minute',
    example: 75,
    minimum: 30,
    maximum: 250
  })
  @IsOptional()
  @IsNumber()
  heartRate?: number;

  @ApiPropertyOptional({
    description: 'Body temperature in Celsius',
    example: 37.2,
    minimum: 30,
    maximum: 45
  })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiPropertyOptional({
    description: 'Oxygen saturation percentage',
    example: 98,
    minimum: 0,
    maximum: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  oxygenSaturation?: number;

  @ApiPropertyOptional({
    description: 'Respiratory rate per minute',
    example: 16,
    minimum: 4,
    maximum: 60
  })
  @IsOptional()
  @IsNumber()
  respiratoryRate?: number;
}

export class EmergencyAssessmentRequestDto {
  @ApiProperty({ type: [PrimarySymptomDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrimarySymptomDto)
  primarySymptoms: PrimarySymptomDto[];

  @ApiPropertyOptional({ type: VitalSignsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VitalSignsDto)
  vitalSigns?: VitalSignsDto;
}

export class EmergencyAssessmentResponseDto {
  @ApiProperty({
    description: 'Status of the assessment',
    enum: ['success', 'error'],
    example: 'success'
  })
  status: 'success' | 'error';

  @ApiProperty({
    description: 'Emergency assessment results',
    type: 'object',
    properties: {
      emergencyLevel: {
        type: 'string',
        enum: ['immediate', 'urgent', 'semi-urgent', 'non-urgent'],
        description: 'Determined emergency level'
      },
      recommendations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            action: { type: 'string' },
            priority: { type: 'number' },
            timeframe: { type: 'string' },
            instructions: { type: 'string' }
          }
        },
        description: 'List of recommended actions'
      },
      nearestFacilities: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            distance: { type: 'number' },
            specialties: { type: 'array', items: { type: 'string' } },
            contactInfo: { type: 'string' }
          }
        },
        description: 'Nearest emergency facilities'
      }
    }
  })
  data: {
    emergencyLevel: 'immediate' | 'urgent' | 'semi-urgent' | 'non-urgent';
    recommendations: Array<{
      action: string;
      priority: number;
      timeframe: string;
      instructions: string;
    }>;
    nearestFacilities?: Array<{
      name: string;
      distance: number;
      specialties: string[];
      contactInfo: string;
    }>;
  };
} 