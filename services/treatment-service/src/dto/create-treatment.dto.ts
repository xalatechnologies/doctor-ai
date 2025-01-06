import { IsString, IsArray, IsOptional, IsDate, IsBoolean, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class MedicationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  dosage: string;

  @IsString()
  @IsNotEmpty()
  route: string;

  @IsString()
  @IsNotEmpty()
  frequency: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}

export class FollowUpScheduleDto {
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  notes: string;

  @IsBoolean()
  completed: boolean;
}

export class CreateTreatmentPlanDto {
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsNotEmpty()
  diagnosis: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationDto)
  medications: MedicationDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FollowUpScheduleDto)
  followUpSchedule: FollowUpScheduleDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recommendations?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lifestyle?: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
} 