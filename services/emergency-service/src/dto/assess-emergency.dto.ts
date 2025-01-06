import { IsString, IsNumber, IsEnum, IsArray, IsOptional, Min, Max, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmergencyCategory } from '@interfaces/emergency.interface';

export class AssessEmergencyDto {
  @ApiProperty({
    description: 'Patient age',
    example: '65',
  })
  @IsString()
  age: string;

  @ApiProperty({
    description: 'Detailed description of the emergency situation',
    example: 'Severe chest pain with radiation to left arm',
  })
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description: 'Category of the emergency',
    enum: EmergencyCategory,
    example: EmergencyCategory.CARDIAC,
  })
  @IsEnum(EmergencyCategory)
  @IsOptional()
  category?: EmergencyCategory;

  @ApiPropertyOptional({
    description: 'Primary symptom or complaint',
    example: 'chest pain',
  })
  @IsString()
  @IsOptional()
  primarySymptom?: string;

  @ApiPropertyOptional({
    description: 'Severity level of the emergency (1-10)',
    minimum: 1,
    maximum: 10,
    example: 8,
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  severityLevel?: number;

  @ApiPropertyOptional({
    description: 'Level of distress (1-10)',
    minimum: 1,
    maximum: 10,
    example: 7,
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  distressLevel?: number;

  @ApiPropertyOptional({
    description: 'Onset of symptoms',
    example: 'sudden',
  })
  @IsString()
  @IsOptional()
  onset?: string;

  @ApiPropertyOptional({
    description: 'Existing medical conditions',
    type: [String],
    example: ['diabetes', 'hypertension'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  existingConditions?: string[];

  @ApiPropertyOptional({
    description: 'Secondary symptoms',
    type: [String],
    example: ['shortness of breath', 'nausea'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  secondarySymptoms?: string[];

  @ApiPropertyOptional({
    description: 'Factors that trigger or worsen symptoms',
    type: [String],
    example: ['physical exertion', 'lying flat'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  triggers?: string[];

  @ApiPropertyOptional({
    description: 'Factors that alleviate symptoms',
    type: [String],
    example: ['rest', 'sitting upright'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alleviatingFactors?: string[];

  @ApiPropertyOptional({
    description: 'Factors that aggravate symptoms',
    type: [String],
    example: ['movement', 'deep breathing'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aggravatingFactors?: string[];

  @ApiPropertyOptional({
    description: 'Current medications being taken',
    type: [String],
    example: ['aspirin', 'metoprolol'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  currentMedications?: string[];

  @ApiPropertyOptional({
    description: 'Known allergies',
    type: [String],
    example: ['penicillin', 'latex'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];
} 