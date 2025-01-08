import { MigrationInterface, QueryRunner } from 'typeorm';

export class Symptoms1704672000005 implements MigrationInterface {
  name = 'Symptoms1704672000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Symptom categories table
    await queryRunner.query(`
      CREATE TABLE "symptom_categories" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL UNIQUE,
        "description" text,
        "severity_threshold" integer,
        "parent_id" uuid REFERENCES "symptom_categories"("id"),
        "metadata" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Symptoms table
    await queryRunner.query(`
      CREATE TABLE "symptoms" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL UNIQUE,
        "description" text NOT NULL,
        "category_id" uuid NOT NULL REFERENCES "symptom_categories"("id"),
        "severity_scale" jsonb NOT NULL,
        "common_causes" jsonb,
        "risk_factors" jsonb,
        "typical_duration" jsonb,
        "warning_signs" jsonb,
        "metadata" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Symptom relationships table (for related symptoms)
    await queryRunner.query(`
      CREATE TABLE "symptom_relationships" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "source_symptom_id" uuid NOT NULL REFERENCES "symptoms"("id"),
        "related_symptom_id" uuid NOT NULL REFERENCES "symptoms"("id"),
        "relationship_type" varchar NOT NULL,
        "correlation_strength" float,
        "metadata" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "unique_symptom_relationship" UNIQUE ("source_symptom_id", "related_symptom_id")
      )
    `);

    // Symptom questions table (for diagnostic questions)
    await queryRunner.query(`
      CREATE TABLE "symptom_questions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "symptom_id" uuid NOT NULL REFERENCES "symptoms"("id"),
        "question_text" text NOT NULL,
        "question_type" varchar NOT NULL,
        "options" jsonb,
        "priority" integer NOT NULL DEFAULT 0,
        "follow_up_logic" jsonb,
        "metadata" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Symptom triggers table
    await queryRunner.query(`
      CREATE TABLE "symptom_triggers" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "symptom_id" uuid NOT NULL REFERENCES "symptoms"("id"),
        "trigger_type" varchar NOT NULL,
        "trigger_data" jsonb NOT NULL,
        "confidence_level" float,
        "evidence_base" text,
        "metadata" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "idx_symptoms_category_id" ON "symptoms"("category_id");
      CREATE INDEX "idx_symptom_categories_parent_id" ON "symptom_categories"("parent_id");
      CREATE INDEX "idx_symptom_relationships_source" ON "symptom_relationships"("source_symptom_id");
      CREATE INDEX "idx_symptom_relationships_related" ON "symptom_relationships"("related_symptom_id");
      CREATE INDEX "idx_symptom_questions_symptom_id" ON "symptom_questions"("symptom_id");
      CREATE INDEX "idx_symptom_triggers_symptom_id" ON "symptom_triggers"("symptom_id");
      CREATE INDEX "idx_symptoms_name" ON "symptoms"("name");
      CREATE INDEX "idx_symptom_categories_name" ON "symptom_categories"("name");
    `);

    // Add GiST index for full-text search
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
      CREATE INDEX "idx_symptoms_description_trgm" ON "symptoms" USING gin (description gin_trgm_ops);
      CREATE INDEX "idx_symptom_categories_description_trgm" ON "symptom_categories" USING gin (description gin_trgm_ops);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX "idx_symptom_categories_description_trgm";
      DROP INDEX "idx_symptoms_description_trgm";
      DROP INDEX "idx_symptom_categories_name";
      DROP INDEX "idx_symptoms_name";
      DROP INDEX "idx_symptom_triggers_symptom_id";
      DROP INDEX "idx_symptom_questions_symptom_id";
      DROP INDEX "idx_symptom_relationships_related";
      DROP INDEX "idx_symptom_relationships_source";
      DROP INDEX "idx_symptom_categories_parent_id";
      DROP INDEX "idx_symptoms_category_id";
    `);

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE "symptom_triggers"`);
    await queryRunner.query(`DROP TABLE "symptom_questions"`);
    await queryRunner.query(`DROP TABLE "symptom_relationships"`);
    await queryRunner.query(`DROP TABLE "symptoms"`);
    await queryRunner.query(`DROP TABLE "symptom_categories"`);

    // Drop extension if no other tables are using it
    await queryRunner.query(`DROP EXTENSION IF EXISTS pg_trgm`);
  }
} 