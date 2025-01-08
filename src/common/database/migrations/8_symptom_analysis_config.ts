import { MigrationInterface, QueryRunner } from 'typeorm';

export class SymptomAnalysisConfig1704672000007 implements MigrationInterface {
  name = 'SymptomAnalysisConfig1704672000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Analysis rules table
    await queryRunner.query(`
      CREATE TABLE "symptom_analysis_rules" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL UNIQUE,
        "description" text,
        "rule_type" varchar NOT NULL,
        "conditions" jsonb NOT NULL,
        "actions" jsonb NOT NULL,
        "priority" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "metadata" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Analysis templates table
    await queryRunner.query(`
      CREATE TABLE "symptom_analysis_templates" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL UNIQUE,
        "description" text,
        "category_id" uuid REFERENCES "symptom_categories"("id"),
        "questionnaire" jsonb NOT NULL,
        "scoring_logic" jsonb NOT NULL,
        "risk_factors" jsonb,
        "recommendations" jsonb,
        "metadata" jsonb,
        "version" integer NOT NULL DEFAULT 1,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Analysis sessions table
    await queryRunner.query(`
      CREATE TABLE "symptom_analysis_sessions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id"),
        "template_id" uuid NOT NULL REFERENCES "symptom_analysis_templates"("id"),
        "responses" jsonb NOT NULL,
        "analysis_results" jsonb NOT NULL,
        "risk_level" varchar NOT NULL,
        "recommendations" jsonb,
        "follow_up_required" boolean DEFAULT false,
        "metadata" jsonb,
        "completed_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Analysis feedback table
    await queryRunner.query(`
      CREATE TABLE "symptom_analysis_feedback" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "session_id" uuid NOT NULL REFERENCES "symptom_analysis_sessions"("id"),
        "user_id" uuid NOT NULL REFERENCES "users"("id"),
        "accuracy_rating" integer,
        "usefulness_rating" integer,
        "feedback_text" text,
        "suggested_improvements" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "idx_analysis_rules_type" ON "symptom_analysis_rules"("rule_type");
      CREATE INDEX "idx_analysis_rules_active" ON "symptom_analysis_rules"("is_active");
      CREATE INDEX "idx_analysis_templates_category" ON "symptom_analysis_templates"("category_id");
      CREATE INDEX "idx_analysis_templates_active" ON "symptom_analysis_templates"("is_active");
      CREATE INDEX "idx_analysis_sessions_user" ON "symptom_analysis_sessions"("user_id");
      CREATE INDEX "idx_analysis_sessions_template" ON "symptom_analysis_sessions"("template_id");
      CREATE INDEX "idx_analysis_sessions_risk" ON "symptom_analysis_sessions"("risk_level");
      CREATE INDEX "idx_analysis_feedback_session" ON "symptom_analysis_feedback"("session_id");
    `);

    // Add composite indexes
    await queryRunner.query(`
      CREATE INDEX "idx_analysis_sessions_user_date" ON "symptom_analysis_sessions"("user_id", "created_at");
      CREATE INDEX "idx_analysis_sessions_template_date" ON "symptom_analysis_sessions"("template_id", "created_at");
    `);

    // Add partial indexes
    await queryRunner.query(`
      CREATE INDEX "idx_incomplete_sessions" ON "symptom_analysis_sessions"("user_id")
      WHERE completed_at IS NULL;
      
      CREATE INDEX "idx_follow_up_required" ON "symptom_analysis_sessions"("user_id")
      WHERE follow_up_required = true;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX "idx_follow_up_required";
      DROP INDEX "idx_incomplete_sessions";
      DROP INDEX "idx_analysis_sessions_template_date";
      DROP INDEX "idx_analysis_sessions_user_date";
      DROP INDEX "idx_analysis_feedback_session";
      DROP INDEX "idx_analysis_sessions_risk";
      DROP INDEX "idx_analysis_sessions_template";
      DROP INDEX "idx_analysis_sessions_user";
      DROP INDEX "idx_analysis_templates_active";
      DROP INDEX "idx_analysis_templates_category";
      DROP INDEX "idx_analysis_rules_active";
      DROP INDEX "idx_analysis_rules_type";
    `);

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE "symptom_analysis_feedback"`);
    await queryRunner.query(`DROP TABLE "symptom_analysis_sessions"`);
    await queryRunner.query(`DROP TABLE "symptom_analysis_templates"`);
    await queryRunner.query(`DROP TABLE "symptom_analysis_rules"`);
  }
} 