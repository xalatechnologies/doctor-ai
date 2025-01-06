import { IsString, IsArray, IsOptional, IsDate, IsNumber, IsBoolean, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { TreatmentStatus } from '@interfaces/treatment.interface';
import { MedicationDto, FollowUpScheduleDto } from './create-treatment.dto';

export class UpdateTreatmentPlanDto {
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationDto)
  medications?: MedicationDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FollowUpScheduleDto)
  followUpSchedule?: FollowUpScheduleDto[];

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
  @IsString()
  status?: TreatmentStatus;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}

export class SymptomProgressDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  severity: number;

  @IsNumber()
  previousSeverity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class MedicationAdherenceDto {
  @IsString()
  @IsNotEmpty()
  medicationId: string;

  @IsNumber()
  adherenceRate: number;

  @IsNumber()
  missedDoses: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sideEffects?: string[];
}

export class UpdateTreatmentProgressDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SymptomProgressDto)
  symptoms: SymptomProgressDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationAdherenceDto)
  medicationAdherence: MedicationAdherenceDto[];

  @IsOptional()
  @IsString()
  notes?: string;
} 