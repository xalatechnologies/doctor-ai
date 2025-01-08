import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create extension for UUID generation
  pgm.createExtension('uuid-ossp', { ifNotExists: true });

  // Create medical_conditions table
  pgm.createTable('medical_conditions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    name: { type: 'varchar(255)', notNull: true },
    icd_10_code: { type: 'varchar(10)' },
    snomed_ct_code: { type: 'varchar(20)' },
    category: { type: 'varchar(100)', notNull: true },
    // ... rest of the columns from schema.sql
  });

  // Create medical_recommendations table
  pgm.createTable('medical_recommendations', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    condition_id: {
      type: 'uuid',
      notNull: true,
      references: 'medical_conditions',
      onDelete: 'CASCADE',
    },
    type: {
      type: 'varchar(50)',
      notNull: true,
      check: "type IN ('lifestyle', 'medication', 'followup', 'prevention')",
    },
    // ... rest of the columns from schema.sql
  });

  // Create medical_history table
  pgm.createTable('medical_history', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    patient_id: { type: 'uuid', notNull: true },
    date: { type: 'timestamp with time zone', notNull: true },
    type: {
      type: 'varchar(50)',
      notNull: true,
      check: "type IN ('consultation', 'diagnosis', 'treatment', 'followup')",
    },
    // ... rest of the columns from schema.sql
  });

  // Create indexes
  pgm.createIndex('medical_recommendations', 'condition_id');
  pgm.createIndex('medical_recommendations', 'type');
  pgm.createIndex('medical_history', 'patient_id');
  pgm.createIndex('medical_history', 'date');
  pgm.createIndex('medical_history', 'type');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('medical_history');
  pgm.dropTable('medical_recommendations');
  pgm.dropTable('medical_conditions');
  pgm.dropExtension('uuid-ossp');
}
