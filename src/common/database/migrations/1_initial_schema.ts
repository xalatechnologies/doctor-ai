import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1704672000000 implements MigrationInterface {
  name = 'InitialSchema1704672000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" varchar NOT NULL UNIQUE,
        "password_hash" varchar NOT NULL,
        "first_name" varchar NOT NULL,
        "last_name" varchar NOT NULL,
        "role" varchar NOT NULL DEFAULT 'patient',
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Medical histories table
    await queryRunner.query(`
      CREATE TABLE "medical_histories" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id"),
        "conditions" jsonb,
        "medications" jsonb,
        "allergies" jsonb,
        "surgeries" jsonb,
        "family_history" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Symptom analyses table
    await queryRunner.query(`
      CREATE TABLE "symptom_analyses" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id"),
        "symptoms" jsonb NOT NULL,
        "analysis_result" jsonb NOT NULL,
        "risk_level" varchar NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Follow-up questions table
    await queryRunner.query(`
      CREATE TABLE "follow_up_questions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "analysis_id" uuid NOT NULL REFERENCES "symptom_analyses"("id"),
        "questions" jsonb NOT NULL,
        "answers" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "answered_at" timestamp
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "idx_medical_histories_user_id" ON "medical_histories"("user_id");
      CREATE INDEX "idx_symptom_analyses_user_id" ON "symptom_analyses"("user_id");
      CREATE INDEX "idx_follow_up_questions_analysis_id" ON "follow_up_questions"("analysis_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX "idx_follow_up_questions_analysis_id";
      DROP INDEX "idx_symptom_analyses_user_id";
      DROP INDEX "idx_medical_histories_user_id";
    `);

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE "follow_up_questions"`);
    await queryRunner.query(`DROP TABLE "symptom_analyses"`);
    await queryRunner.query(`DROP TABLE "medical_histories"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
} 