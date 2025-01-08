import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsOptional,
  IsNumber,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Data transfer object for vital signs measurements.
 */
export class VitalSignsDto {
  @ApiProperty({
    example: 120,
    description: 'Systolic blood pressure in mmHg',
    required: false,
    minimum: 60,
    maximum: 300,
  })
  @IsNumber()
  @IsOptional()
  @Min(60)
  @Max(300)
  public readonly systolic?: number;

  @ApiProperty({
    example: 80,
    description: 'Diastolic blood pressure in mmHg',
    required: false,
    minimum: 40,
    maximum: 200,
  })
  @IsNumber()
  @IsOptional()
  @Min(40)
  @Max(200)
  public readonly diastolic?: number;

  @ApiProperty({
    example: 72,
    description: 'Heart rate in beats per minute',
    required: false,
    minimum: 30,
    maximum: 250,
  })
  @IsNumber()
  @IsOptional()
  @Min(30)
  @Max(250)
  public readonly heartRate?: number;

  @ApiProperty({
    example: 98.6,
    description: 'Body temperature in Fahrenheit',
    required: false,
    minimum: 90,
    maximum: 110,
  })
  @IsNumber()
  @IsOptional()
  @Min(90)
  @Max(110)
  public readonly temperature?: number;

  @ApiProperty({
    example: 16,
    description: 'Respiratory rate per minute',
    required: false,
    minimum: 8,
    maximum: 60,
  })
  @IsNumber()
  @IsOptional()
  @Min(8)
  @Max(60)
  public readonly respiratoryRate?: number;

  @ApiProperty({
    example: 98,
    description: 'Oxygen saturation percentage',
    required: false,
    minimum: 50,
    maximum: 100,
  })
  @IsNumber()
  @IsOptional()
  @Min(50)
  @Max(100)
  public readonly oxygenSaturation?: number;
}

/**
 * Data transfer object for symptom questionnaire submission.
 */
export class QuestionnaireDto {
  @ApiProperty({
    example: ['Headache', 'Nausea'],
    description: 'List of reported symptoms',
    isArray: true,
    minItems: 1,
  })
  @IsArray()
  @IsString({ each: true })
  public readonly symptoms!: string[];

  @ApiProperty({
    example: 'No chronic conditions',
    description: 'Patient medical history',
    minLength: 1,
  })
  @IsString()
  public readonly medicalHistory!: string;

  @ApiProperty({
    example: ['Aspirin', 'Ibuprofen'],
    description: 'Current medications',
    required: false,
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  public readonly medications?: string[];

  @ApiProperty({
    example: ['Penicillin'],
    description: 'Known allergies',
    required: false,
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  public readonly allergies?: string[];

  @ApiProperty({
    type: VitalSignsDto,
    description: 'Vital signs measurements',
    required: false,
  })
  @ValidateNested()
  @Type(() => VitalSignsDto)
  @IsOptional()
  public readonly vitalSigns?: VitalSignsDto;
} 