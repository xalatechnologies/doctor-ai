import { IsArray, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VitalSignsDto, PrimarySymptomDto } from './emergency-assessment.dto';

export enum SymptomRelation {
  DIRECT = 'direct',
  INDIRECT = 'indirect',
  POSSIBLE = 'possible'
}

export enum RiskImpact {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export class AssociatedSymptomDto {
  @ApiProperty({ description: 'Name of the associated symptom' })
  @IsString()
  symptom: string;

  @ApiProperty({ 
    enum: SymptomRelation,
    description: 'Relationship to primary symptoms'
  })
  @IsEnum(SymptomRelation)
  relation: SymptomRelation;

  @ApiProperty({ description: 'When the symptom started' })
  @IsString()
  timeOfOnset: string;
}

export class RiskFactorDto {
  @ApiProperty({ description: 'Risk factor name' })
  @IsString()
  factor: string;

  @ApiProperty({ 
    enum: RiskImpact,
    description: 'Impact level of the risk factor'
  })
  @IsEnum(RiskImpact)
  impact: RiskImpact;

  @ApiProperty({ description: 'Detailed information about the risk factor' })
  @IsString()
  details: string;
}

export class EnvironmentalFactorDto {
  @ApiProperty({ description: 'Environmental factor name' })
  @IsString()
  factor: string;

  @ApiProperty({ description: 'Relevance score (1-10)', minimum: 1, maximum: 10 })
  @IsNumber()
  relevance: number;

  @ApiProperty({ description: 'Description of the environmental factor' })
  @IsString()
  description: string;
}

export class SymptomAnalysisRequestDto {
  @ApiProperty({ type: [PrimarySymptomDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrimarySymptomDto)
  primarySymptoms: PrimarySymptomDto[];

  @ApiPropertyOptional({ type: [AssociatedSymptomDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssociatedSymptomDto)
  associatedSymptoms?: AssociatedSymptomDto[];

  @ApiPropertyOptional({ type: [RiskFactorDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RiskFactorDto)
  riskFactors?: RiskFactorDto[];

  @ApiPropertyOptional({ type: VitalSignsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VitalSignsDto)
  vitalSigns?: VitalSignsDto;

  @ApiPropertyOptional({ type: [EnvironmentalFactorDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnvironmentalFactorDto)
  environmentalFactors?: EnvironmentalFactorDto[];
} 