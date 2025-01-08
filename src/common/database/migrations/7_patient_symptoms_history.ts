import { MigrationInterface, QueryRunner } from 'typeorm';

export class PatientSymptomsHistory1704672000006 implements MigrationInterface {
  name = 'PatientSymptomsHistory1704672000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Patient symptom records table
    await queryRunner.query(`
      CREATE TABLE "patient_symptom_records" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id"),
        "symptom_id" uuid NOT NULL REFERENCES "symptoms"("id"),
        "severity" integer NOT NULL,
        "onset_date" timestamp NOT NULL,
        "resolution_date" timestamp,
        "duration_hours" integer,
        "is_recurring" boolean DEFAULT false,
        "frequency" jsonb,
        "notes" text,
        "reported_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Symptom progression tracking
    await queryRunner.query(`
      CREATE TABLE "symptom_progression" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "record_id" uuid NOT NULL REFERENCES "patient_symptom_records"("id"),
        "severity_change" integer NOT NULL,
        "recorded_at" timestamp NOT NULL DEFAULT now(),
        "associated_factors" jsonb,
        "notes" text,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Symptom triggers tracking
    await queryRunner.query(`
      CREATE TABLE "patient_symptom_triggers" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "record_id" uuid NOT NULL REFERENCES "patient_symptom_records"("id"),
        "trigger_id" uuid REFERENCES "symptom_triggers"("id"),
        "custom_trigger" jsonb,
        "trigger_certainty" float,
        "occurrence_datetime" timestamp NOT NULL,
        "notes" text,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Symptom correlations
    await queryRunner.query(`
      CREATE TABLE "patient_symptom_correlations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id"),
        "primary_record_id" uuid NOT NULL REFERENCES "patient_symptom_records"("id"),
        "correlated_record_id" uuid NOT NULL REFERENCES "patient_symptom_records"("id"),
        "correlation_type" varchar NOT NULL,
        "correlation_strength" float NOT NULL,
        "time_offset_hours" integer,
        "analysis_data" jsonb,
        "confidence_level" float NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "unique_symptom_correlation" UNIQUE ("primary_record_id", "correlated_record_id")
      )
    `);

    // Treatment effectiveness tracking
    await queryRunner.query(`
      CREATE TABLE "symptom_treatment_outcomes" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "record_id" uuid NOT NULL REFERENCES "patient_symptom_records"("id"),
        "treatment_id" uuid NOT NULL REFERENCES "treatment_plans"("id"),
        "effectiveness_rating" integer NOT NULL,
        "side_effects" jsonb,
        "outcome_details" jsonb,
        "duration_of_effect_hours" integer,
        "notes" text,
        "recorded_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX "idx_patient_symptom_records_user" ON "patient_symptom_records"("user_id");
      CREATE INDEX "idx_patient_symptom_records_symptom" ON "patient_symptom_records"("symptom_id");
      CREATE INDEX "idx_patient_symptom_records_onset" ON "patient_symptom_records"("onset_date");
      CREATE INDEX "idx_symptom_progression_record" ON "symptom_progression"("record_id");
      CREATE INDEX "idx_patient_symptom_triggers_record" ON "patient_symptom_triggers"("record_id");
      CREATE INDEX "idx_patient_symptom_correlations_user" ON "patient_symptom_correlations"("user_id");
      CREATE INDEX "idx_symptom_treatment_outcomes_record" ON "symptom_treatment_outcomes"("record_id");
      CREATE INDEX "idx_symptom_treatment_outcomes_treatment" ON "symptom_treatment_outcomes"("treatment_id");
    `);

    // Add composite indexes for common queries
    await queryRunner.query(`
      CREATE INDEX "idx_patient_symptoms_user_date" ON "patient_symptom_records"("user_id", "onset_date");
      CREATE INDEX "idx_patient_symptoms_user_symptom" ON "patient_symptom_records"("user_id", "symptom_id");
      CREATE INDEX "idx_symptom_correlations_strength" ON "patient_symptom_correlations"("user_id", "correlation_strength");
    `);

    // Add partial indexes for active symptoms
    await queryRunner.query(`
      CREATE INDEX "idx_active_symptoms" ON "patient_symptom_records"("user_id", "symptom_id")
      WHERE resolution_date IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX "idx_active_symptoms";
      DROP INDEX "idx_symptom_correlations_strength";
      DROP INDEX "idx_patient_symptoms_user_symptom";
      DROP INDEX "idx_patient_symptoms_user_date";
      DROP INDEX "idx_symptom_treatment_outcomes_treatment";
      DROP INDEX "idx_symptom_treatment_outcomes_record";
      DROP INDEX "idx_patient_symptom_correlations_user";
      DROP INDEX "idx_patient_symptom_triggers_record";
      DROP INDEX "idx_symptom_progression_record";
      DROP INDEX "idx_patient_symptom_records_onset";
      DROP INDEX "idx_patient_symptom_records_symptom";
      DROP INDEX "idx_patient_symptom_records_user";
    `);

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE "symptom_treatment_outcomes"`);
    await queryRunner.query(`DROP TABLE "patient_symptom_correlations"`);
    await queryRunner.query(`DROP TABLE "patient_symptom_triggers"`);
    await queryRunner.query(`DROP TABLE "symptom_progression"`);
    await queryRunner.query(`DROP TABLE "patient_symptom_records"`);
  }
} 