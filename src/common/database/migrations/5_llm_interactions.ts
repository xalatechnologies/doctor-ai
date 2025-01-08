import { MigrationInterface, QueryRunner } from 'typeorm';

export class LlmInteractions1704672000004 implements MigrationInterface {
  name = 'LlmInteractions1704672000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // LLM providers table
    await queryRunner.query(`
      CREATE TABLE "llm_providers" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL UNIQUE,
        "config" jsonb NOT NULL,
        "status" varchar NOT NULL DEFAULT 'active',
        "priority" integer NOT NULL DEFAULT 0,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // LLM interactions table
    await queryRunner.query(`
      CREATE TABLE "llm_interactions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id"),
        "provider_id" uuid NOT NULL REFERENCES "llm_providers"("id"),
        "interaction_type" varchar NOT NULL,
        "prompt" text NOT NULL,
        "response" jsonb NOT NULL,
        "metadata" jsonb,
        "tokens_used" integer,
        "duration_ms" integer,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // LLM feedback table
    await queryRunner.query(`
      CREATE TABLE "llm_feedback" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "interaction_id" uuid NOT NULL REFERENCES "llm_interactions"("id"),
        "user_id" uuid NOT NULL REFERENCES "users"("id"),
        "rating" integer,
        "feedback_type" varchar NOT NULL,
        "feedback_data" jsonb NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "idx_llm_providers_status" ON "llm_providers"("status");
      CREATE INDEX "idx_llm_interactions_user_id" ON "llm_interactions"("user_id");
      CREATE INDEX "idx_llm_interactions_provider_id" ON "llm_interactions"("provider_id");
      CREATE INDEX "idx_llm_feedback_interaction_id" ON "llm_feedback"("interaction_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX "idx_llm_feedback_interaction_id";
      DROP INDEX "idx_llm_interactions_provider_id";
      DROP INDEX "idx_llm_interactions_user_id";
      DROP INDEX "idx_llm_providers_status";
    `);

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE "llm_feedback"`);
    await queryRunner.query(`DROP TABLE "llm_interactions"`);
    await queryRunner.query(`DROP TABLE "llm_providers"`);
  }
} 