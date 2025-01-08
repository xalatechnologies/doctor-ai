import { MigrationInterface, QueryRunner } from 'typeorm';

export class Monitoring1704672000003 implements MigrationInterface {
  name = 'Monitoring1704672000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Vital signs monitoring table
    await queryRunner.query(`
      CREATE TABLE "vital_signs_monitoring" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id"),
        "vital_signs" jsonb NOT NULL,
        "device_data" jsonb,
        "alert_triggered" boolean DEFAULT false,
        "notes" text,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Health alerts table
    await queryRunner.query(`
      CREATE TABLE "health_alerts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id"),
        "monitoring_id" uuid REFERENCES "vital_signs_monitoring"("id"),
        "alert_type" varchar NOT NULL,
        "severity" varchar NOT NULL,
        "alert_data" jsonb NOT NULL,
        "status" varchar NOT NULL DEFAULT 'pending',
        "resolved_at" timestamp,
        "resolved_by" uuid REFERENCES "users"("id"),
        "resolution_notes" text,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Alert notifications table
    await queryRunner.query(`
      CREATE TABLE "alert_notifications" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "alert_id" uuid NOT NULL REFERENCES "health_alerts"("id"),
        "recipient_id" uuid NOT NULL REFERENCES "users"("id"),
        "notification_type" varchar NOT NULL,
        "status" varchar NOT NULL DEFAULT 'pending',
        "sent_at" timestamp,
        "read_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "idx_vital_signs_user_id" ON "vital_signs_monitoring"("user_id");
      CREATE INDEX "idx_health_alerts_user_id" ON "health_alerts"("user_id");
      CREATE INDEX "idx_health_alerts_status" ON "health_alerts"("status");
      CREATE INDEX "idx_alert_notifications_alert_id" ON "alert_notifications"("alert_id");
      CREATE INDEX "idx_alert_notifications_recipient_id" ON "alert_notifications"("recipient_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX "idx_alert_notifications_recipient_id";
      DROP INDEX "idx_alert_notifications_alert_id";
      DROP INDEX "idx_health_alerts_status";
      DROP INDEX "idx_health_alerts_user_id";
      DROP INDEX "idx_vital_signs_user_id";
    `);

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE "alert_notifications"`);
    await queryRunner.query(`DROP TABLE "health_alerts"`);
    await queryRunner.query(`DROP TABLE "vital_signs_monitoring"`);
  }
} 