import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class MedicalCondition {
  @Prop({ required: true })
  condition: string;

  @Prop({ required: true })
  date: Date;
}

@Schema({ timestamps: true })
export class FamilyHistoryEntry {
  @Prop({ required: true })
  relation: string;

  @Prop({ required: true })
  condition: string;
}

@Schema({ timestamps: true })
export class Lifestyle {
  @Prop({ 
    required: true,
    enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
    default: 'moderate'
  })
  activityLevel: string;

  @Prop({
    required: true,
    enum: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'other'],
    default: 'omnivore'
  })
  diet: string;

  @Prop({ required: true, default: false })
  smoking: boolean;

  @Prop({ required: true, default: false })
  alcohol: boolean;
}

@Schema({ 
  timestamps: true,
  collection: 'users',
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
})
export class User extends Document {
  @Prop({ 
    required: true,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    index: true
  })
  gender: string;

  @Prop({ 
    required: true,
    min: 0,
    max: 150,
    index: true
  })
  age: number;

  @Prop({ type: [{ type: MongooseSchema.Types.Mixed }] })
  medicalHistory: MedicalCondition[];

  @Prop([String])
  medications: string[];

  @Prop([String])
  allergies: string[];

  @Prop({ type: [{ type: MongooseSchema.Types.Mixed }] })
  familyHistory: FamilyHistoryEntry[];

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  lifestyle: Lifestyle;

  // Virtual field for age group
  @Prop({ 
    type: String,
    get: function(this: User) {
      if (this.age < 18) return 'pediatric';
      if (this.age < 30) return 'young_adult';
      if (this.age < 50) return 'adult';
      if (this.age < 70) return 'middle_aged';
      return 'elderly';
    }
  })
  ageGroup: string;

  // Virtual field for risk factors
  @Prop({
    type: [String],
    get: function(this: User) {
      const risks: string[] = [];
      if (this.lifestyle.smoking) risks.push('smoking');
      if (this.lifestyle.alcohol) risks.push('alcohol');
      if (this.lifestyle.activityLevel === 'sedentary') risks.push('sedentary_lifestyle');
      if (this.age >= 65) risks.push('elderly');
      return risks;
    }
  })
  riskFactors: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add indexes for common queries
UserSchema.index({ age: 1, gender: 1 });
UserSchema.index({ 'medicalHistory.condition': 1 });
UserSchema.index({ medications: 1 });
UserSchema.index({ allergies: 1 });
UserSchema.index({ 'lifestyle.activityLevel': 1 });

// Add virtuals
UserSchema.virtual('ageGroup').get(function(this: User) {
  if (this.age < 18) return 'pediatric';
  if (this.age < 30) return 'young_adult';
  if (this.age < 50) return 'adult';
  if (this.age < 70) return 'middle_aged';
  return 'elderly';
});

UserSchema.virtual('riskFactors').get(function(this: User) {
  const risks: string[] = [];
  if (this.lifestyle.smoking) risks.push('smoking');
  if (this.lifestyle.alcohol) risks.push('alcohol');
  if (this.lifestyle.activityLevel === 'sedentary') risks.push('sedentary_lifestyle');
  if (this.age >= 65) risks.push('elderly');
  return risks;
}); 