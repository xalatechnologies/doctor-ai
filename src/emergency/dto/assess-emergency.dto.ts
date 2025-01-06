import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for assessing emergencies.
 */
export class AssessEmergencyDto {
  /**
   * Primary symptoms reported by the patient.
   */
  @IsNotEmpty()
  @IsArray()
  primarySymptoms: string[];

  /**
   * Additional symptoms, if any.
   */
  @IsArray()
  symptoms?: string[];

  /**
   * Contextual information about the patient.
   */
  @ValidateNested()
  @Type(() => PatientContextDto)
  patientContext?: PatientContextDto;
}

/**
 * DTO for patient context information.
 */
export class PatientContextDto {
  // Define properties relevant to patient context
  // For example:

  /**
   * Age of the patient.
   */
  @IsNotEmpty()
  age: number;

  /**
   * Known medical conditions.
   */
  @IsArray()
  medicalConditions?: string[];
} 