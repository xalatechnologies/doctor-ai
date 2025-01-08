import { MigrationInterface, QueryRunner } from 'typeorm';

export class EmergencyAssessment1704672000001 implements MigrationInterface {
  name = 'EmergencyAssessment1704672000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Emergency cases table
    await queryRunner.query(`
      CREATE TABLE "emergency_cases" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id"),
        "severity_level" varchar NOT NULL,
        "symptoms" jsonb NOT NULL,
        "vital_signs" jsonb,
        "location" jsonb,
        "status" varchar NOT NULL DEFAULT 'pending',
        "assigned_to" uuid REFERENCES "users"("id"),
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Emergency responses table
    await queryRunner.query(`
      CREATE TABLE "emergency_responses" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "case_id" uuid NOT NULL REFERENCES "emergency_cases"("id"),
        "responder_id" uuid NOT NULL REFERENCES "users"("id"),
        "response_type" varchar NOT NULL,
        "action_taken" jsonb NOT NULL,
        "notes" text,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Emergency escalations table
    await queryRunner.query(`
      CREATE TABLE "emergency_escalations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "case_id" uuid NOT NULL REFERENCES "emergency_cases"("id"),
        "escalated_by" uuid NOT NULL REFERENCES "users"("id"),
        "escalation_level" varchar NOT NULL,
        "reason" text NOT NULL,
        "status" varchar NOT NULL DEFAULT 'pending',
        "resolved_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "idx_emergency_cases_user_id" ON "emergency_cases"("user_id");
      CREATE INDEX "idx_emergency_cases_status" ON "emergency_cases"("status");
      CREATE INDEX "idx_emergency_responses_case_id" ON "emergency_responses"("case_id");
      CREATE INDEX "idx_emergency_escalations_case_id" ON "emergency_escalations"("case_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX "idx_emergency_escalations_case_id";
      DROP INDEX "idx_emergency_responses_case_id";
      DROP INDEX "idx_emergency_cases_status";
      DROP INDEX "idx_emergency_cases_user_id";
    `);

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE "emergency_escalations"`);
    await queryRunner.query(`DROP TABLE "emergency_responses"`);
    await queryRunner.query(`DROP TABLE "emergency_cases"`);
  }
} 