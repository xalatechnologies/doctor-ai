import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { RiskLevel, UrgencyLevel } from '../interfaces/common';

@Schema({ timestamps: true })
export class VitalSigns {
  @Prop()
  heartRate?: number;

  @Prop()
  temperature?: number;

  @Prop()
  respiratoryRate?: number;

  @Prop()
  oxygenSaturation?: number;

  @Prop()
  bloodPressureSystolic?: number;

  @Prop()
  bloodPressureDiastolic?: number;

  @Prop()
  summary?: string;

  @Prop([Number])
  findings?: number[];

  @Prop()
  requiresAttention?: boolean;
}

@Schema({ timestamps: true })
export class Symptom {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  severity: number;

  @Prop({ required: true })
  onset: string;

  @Prop({ required: true })
  duration: string;
}

@Schema({ timestamps: true })
export class MedicalReport {
  @Prop({ required: true })
  reportId: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ required: true })
  patientId: string;

  @Prop({ type: [{ type: MongooseSchema.Types.Mixed }], required: true })
  symptoms: Symptom[];

  @Prop({ type: MongooseSchema.Types.Mixed })
  vitalSigns?: VitalSigns;

  @Prop([String])
  diagnosis: string[];

  @Prop([String])
  recommendations: string[];

  @Prop([String])
  followUpPlan: string[];

  @Prop({ required: true, enum: UrgencyLevel })
  urgencyLevel: UrgencyLevel;

  @Prop({ required: true, enum: RiskLevel })
  riskLevel: RiskLevel;

  @Prop({ required: true })
  confidence: number;
}

@Schema({ timestamps: true })
export class SymptomAnalysis extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({
    type: {
      symptoms: [String],
      medicalHistory: String,
      medications: [String],
      allergies: [String],
      vitalSigns: MongooseSchema.Types.Mixed
    },
    required: true
  })
  data: {
    symptoms: string[];
    medicalHistory?: string;
    medications?: string[];
    allergies?: string[];
    vitalSigns?: {
      heartRate?: number;
      temperature?: number;
      respiratoryRate?: number;
      oxygenSaturation?: number;
      systolic?: number;
      diastolic?: number;
    };
  };

  @Prop({ required: true, enum: ['pending', 'in_progress', 'completed', 'failed'] })
  status: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  report?: MedicalReport;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const VitalSignsSchema = SchemaFactory.createForClass(VitalSigns);
export const SymptomSchema = SchemaFactory.createForClass(Symptom);
export const MedicalReportSchema = SchemaFactory.createForClass(MedicalReport);
export const SymptomAnalysisSchema = SchemaFactory.createForClass(SymptomAnalysis); 