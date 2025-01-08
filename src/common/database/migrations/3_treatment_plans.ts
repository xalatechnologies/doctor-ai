import { MigrationInterface, QueryRunner } from 'typeorm';

export class TreatmentPlans1704672000002 implements MigrationInterface {
  name = 'TreatmentPlans1704672000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Treatment plans table
    await queryRunner.query(`
      CREATE TABLE "treatment_plans" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id"),
        "diagnosis" jsonb NOT NULL,
        "treatment_goals" jsonb NOT NULL,
        "medications" jsonb,
        "procedures" jsonb,
        "lifestyle_changes" jsonb,
        "follow_up_schedule" jsonb,
        "status" varchar NOT NULL DEFAULT 'active',
        "created_by" uuid NOT NULL REFERENCES "users"("id"),
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Treatment progress table
    await queryRunner.query(`
      CREATE TABLE "treatment_progress" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "plan_id" uuid NOT NULL REFERENCES "treatment_plans"("id"),
        "milestone_type" varchar NOT NULL,
        "milestone_data" jsonb NOT NULL,
        "status" varchar NOT NULL,
        "notes" text,
        "completed_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Treatment adjustments table
    await queryRunner.query(`
      CREATE TABLE "treatment_adjustments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "plan_id" uuid NOT NULL REFERENCES "treatment_plans"("id"),
        "adjusted_by" uuid NOT NULL REFERENCES "users"("id"),
        "adjustment_type" varchar NOT NULL,
        "previous_state" jsonb NOT NULL,
        "new_state" jsonb NOT NULL,
        "reason" text NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "idx_treatment_plans_user_id" ON "treatment_plans"("user_id");
      CREATE INDEX "idx_treatment_plans_status" ON "treatment_plans"("status");
      CREATE INDEX "idx_treatment_progress_plan_id" ON "treatment_progress"("plan_id");
      CREATE INDEX "idx_treatment_adjustments_plan_id" ON "treatment_adjustments"("plan_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX "idx_treatment_adjustments_plan_id";
      DROP INDEX "idx_treatment_progress_plan_id";
      DROP INDEX "idx_treatment_plans_status";
      DROP INDEX "idx_treatment_plans_user_id";
    `);

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE "treatment_adjustments"`);
    await queryRunner.query(`DROP TABLE "treatment_progress"`);
    await queryRunner.query(`DROP TABLE "treatment_plans"`);
  }
} 