import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsBoolean,
  IsDate,
  IsOptional,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export enum ActivityLevel {
  SEDENTARY = 'sedentary',
  LIGHT = 'light',
  MODERATE = 'moderate',
  ACTIVE = 'active',
  VERY_ACTIVE = 'very_active',
}

export enum DietType {
  OMNIVORE = 'omnivore',
  VEGETARIAN = 'vegetarian',
  VEGAN = 'vegan',
  PESCATARIAN = 'pescatarian',
  KETO = 'keto',
  OTHER = 'other',
}

export class MedicalConditionDto {
  @ApiProperty({ example: 'Hypertension' })
  @IsString()
  condition: string;

  @ApiProperty({ example: '2023-01-01' })
  @IsDate()
  @Type(() => Date)
  date: Date;
}

export class FamilyHistoryEntryDto {
  @ApiProperty({ example: 'father', description: 'Family relation' })
  @IsString()
  relation: string;

  @ApiProperty({ example: 'Diabetes Type 2' })
  @IsString()
  condition: string;
}

export class LifestyleDto {
  @ApiProperty({ enum: ActivityLevel, example: ActivityLevel.MODERATE })
  @IsEnum(ActivityLevel)
  activityLevel: ActivityLevel;

  @ApiProperty({ enum: DietType, example: DietType.OMNIVORE })
  @IsEnum(DietType)
  diet: DietType;

  @ApiProperty({ example: false })
  @IsBoolean()
  smoking: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  alcohol: boolean;
}

export class CreateUserDto {
  @ApiProperty({ enum: Gender, example: Gender.PREFER_NOT_TO_SAY })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: 30, minimum: 0, maximum: 150 })
  @IsNumber()
  @Min(0)
  @Max(150)
  age: number;

  @ApiProperty({ type: [MedicalConditionDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicalConditionDto)
  medicalHistory?: MedicalConditionDto[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medications?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiProperty({ type: [FamilyHistoryEntryDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FamilyHistoryEntryDto)
  familyHistory?: FamilyHistoryEntryDto[];

  @ApiProperty({ type: LifestyleDto })
  @ValidateNested()
  @Type(() => LifestyleDto)
  lifestyle: LifestyleDto;
}

export class UpdateUserDto {
  @ApiProperty({ enum: Gender, example: Gender.PREFER_NOT_TO_SAY, required: false })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({ example: 30, minimum: 0, maximum: 150, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(150)
  age?: number;

  @ApiProperty({ type: [MedicalConditionDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicalConditionDto)
  medicalHistory?: MedicalConditionDto[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medications?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiProperty({ type: [FamilyHistoryEntryDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FamilyHistoryEntryDto)
  familyHistory?: FamilyHistoryEntryDto[];

  @ApiProperty({ type: LifestyleDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => LifestyleDto)
  lifestyle?: LifestyleDto;
}

export class UserResponseDto extends CreateUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ enum: ['pediatric', 'young_adult', 'adult', 'middle_aged', 'elderly'] })
  ageGroup: string;

  @ApiProperty({ type: [String] })
  riskFactors: string[];
} 