import baseMigrationSql from "../drizzle/0000_known_human_robot.sql?raw";
import commerceMigrationSql from "../drizzle/0001_lively_silver_fox.sql?raw";
import productReviewsMigrationSql from "../drizzle/0002_clear_rhino.sql?raw";
import communicationHealthcareMigrationSql from "../drizzle/0003_yellow_leopardon.sql?raw";
import queueLifecycleMigrationSql from "../drizzle/0004_pretty_puma.sql?raw";
import queueExpiryMigrationSql from "../drizzle/0005_loving_absorbing_man.sql?raw";
import richMediaMigrationSql from "../drizzle/0006_fine_onslaught.sql?raw";
import externalAuthMigrationSql from "../drizzle/0007_funny_bloodaxe.sql?raw";
import googleOAuthMigrationSql from "../drizzle/0008_google_oauth.sql?raw";
import { getD1 } from "@/db/runtime";

let bootstrapPromise: Promise<void> | null = null;
let databaseFullyReady = false;

const BASE_INDEX_MARKER = "schema_index_version";
const BASE_INDEX_VERSION = "schema-indexes-v1";
const COMMERCE_SCHEMA_MARKER = "commerce_schema_version";
const COMMERCE_SCHEMA_VERSION = "commerce-schema-v2";
const COMMERCE_INDEX_MARKER = "commerce_index_version";
const COMMERCE_INDEX_VERSION = "commerce-indexes-v2";
const FEATURE_SCHEMA_MARKER = "communication_healthcare_schema_version";
const FEATURE_SCHEMA_VERSION = "communication-healthcare-schema-v1";
const FEATURE_INDEX_MARKER = "communication_healthcare_index_version";
const FEATURE_INDEX_VERSION = "communication-healthcare-indexes-v1";
const QUEUE_SCHEMA_MARKER = "healthcare_queue_schema_version";
const QUEUE_SCHEMA_VERSION = "healthcare-queue-schema-v3";
const RICH_MEDIA_SCHEMA_MARKER = "rich_media_schema_version";
const RICH_MEDIA_SCHEMA_VERSION = "rich-media-schema-v1";
const EXTERNAL_AUTH_SCHEMA_MARKER = "external_auth_schema_version";
const EXTERNAL_AUTH_SCHEMA_VERSION = "external-auth-schema-v2";

function idempotentStatement(statement: string): string {
  return statement
    .replace(/^CREATE TABLE\s+/i, "CREATE TABLE IF NOT EXISTS ")
    .replace(/^CREATE UNIQUE INDEX\s+/i, "CREATE UNIQUE INDEX IF NOT EXISTS ")
    .replace(/^CREATE INDEX\s+/i, "CREATE INDEX IF NOT EXISTS ")
    .replace(/^CREATE TRIGGER\s+/i, "CREATE TRIGGER IF NOT EXISTS ");
}

function migrationStatements(sql: string): string[] {
  return sql
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map(idempotentStatement);
}

function versionMarker(
  db: ReturnType<typeof getD1>,
  key: string,
  value: string,
) {
  return db
    .prepare(
      "INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    )
    .bind(key, value, Math.floor(Date.now() / 1000));
}

async function bootstrapDatabase(): Promise<void> {
  if (databaseFullyReady) return;
  const db = getD1();
  const ready = await db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'system_settings'")
    .first<{ name: string }>();

  const baseStatements = migrationStatements(baseMigrationSql);
  const commerceStatements = [
    ...migrationStatements(commerceMigrationSql),
    ...migrationStatements(productReviewsMigrationSql),
  ];
  const featureStatements = migrationStatements(communicationHealthcareMigrationSql);
  const queueLifecycleStatements = [
    ...migrationStatements(queueLifecycleMigrationSql),
    ...migrationStatements(queueExpiryMigrationSql),
  ];
  const richMediaStatements = migrationStatements(richMediaMigrationSql);
  const externalAuthStatements = [
    ...migrationStatements(externalAuthMigrationSql),
    ...migrationStatements(googleOAuthMigrationSql),
  ];
  const baseTables = baseStatements.filter((statement) => /^CREATE TABLE/i.test(statement));
  const baseIndexes = baseStatements.filter((statement) => /^CREATE (UNIQUE )?INDEX/i.test(statement));
  const commerceStructures = commerceStatements.filter(
    (statement) => /^CREATE (TABLE|TRIGGER)/i.test(statement),
  );
  const commerceIndexes = commerceStatements.filter(
    (statement) => /^CREATE (UNIQUE )?INDEX/i.test(statement),
  );
  const featureStructures = featureStatements.filter(
    (statement) => /^CREATE (TABLE|TRIGGER)/i.test(statement),
  );
  const featureIndexes = featureStatements.filter(
    (statement) => /^CREATE (UNIQUE )?INDEX/i.test(statement),
  );
  const categoryModuleAlter = featureStatements.find((statement) =>
    /^ALTER TABLE `?categories`? ADD `?module`?/i.test(statement),
  );

  if (ready?.name !== "system_settings") {
    // A new database needs both generations of tables immediately so auth and
    // commerce code can safely seed and query them on the first request. This
    // is 33 schema statements plus one progress marker, leaving room beneath
    // D1's per-invocation query ceiling for the initial catalog seed.
    await db.batch(
      [
        ...baseTables.map((statement) => db.prepare(statement)),
        ...commerceStructures.map((statement) => db.prepare(statement)),
        ...featureStructures.map((statement) => db.prepare(statement)),
        ...(categoryModuleAlter ? [db.prepare(categoryModuleAlter)] : []),
        ...queueLifecycleStatements.map((statement) => db.prepare(statement)),
        ...richMediaStatements.map((statement) => db.prepare(statement)),
        ...externalAuthStatements.map((statement) => db.prepare(statement)),
        versionMarker(db, COMMERCE_SCHEMA_MARKER, COMMERCE_SCHEMA_VERSION),
        versionMarker(db, FEATURE_SCHEMA_MARKER, FEATURE_SCHEMA_VERSION),
        versionMarker(db, QUEUE_SCHEMA_MARKER, QUEUE_SCHEMA_VERSION),
        versionMarker(db, RICH_MEDIA_SCHEMA_MARKER, RICH_MEDIA_SCHEMA_VERSION),
        versionMarker(db, EXTERNAL_AUTH_SCHEMA_MARKER, EXTERNAL_AUTH_SCHEMA_VERSION),
      ],
    );
    return;
  }

  const progress = await db
    .prepare(
      "SELECT key, value FROM system_settings WHERE key IN (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      BASE_INDEX_MARKER,
      COMMERCE_SCHEMA_MARKER,
      COMMERCE_INDEX_MARKER,
      FEATURE_SCHEMA_MARKER,
      FEATURE_INDEX_MARKER,
      QUEUE_SCHEMA_MARKER,
      RICH_MEDIA_SCHEMA_MARKER,
      EXTERNAL_AUTH_SCHEMA_MARKER,
    )
    .all<{ key: string; value: string }>();
  const versions = new Map((progress.results ?? []).map((row) => [row.key, row.value]));

  // Apply exactly one incomplete phase per invocation. Existing installations
  // receive the new tables before their indexes, while a fresh installation
  // completes the two index batches over the next two requests. No phase uses
  // more than 35 D1 queries including readiness/progress checks.
  if (versions.get(COMMERCE_SCHEMA_MARKER) !== COMMERCE_SCHEMA_VERSION) {
    await db.batch([
      ...commerceStructures.map((statement) => db.prepare(statement)),
      versionMarker(db, COMMERCE_SCHEMA_MARKER, COMMERCE_SCHEMA_VERSION),
    ]);
    return;
  }

  if (versions.get(FEATURE_SCHEMA_MARKER) !== FEATURE_SCHEMA_VERSION) {
    const categoryColumns = await db
      .prepare("PRAGMA table_info(categories)")
      .all<{ name: string }>();
    const hasModule = (categoryColumns.results ?? []).some((column) => column.name === "module");
    await db.batch([
      ...featureStructures.map((statement) => db.prepare(statement)),
      ...(!hasModule && categoryModuleAlter ? [db.prepare(categoryModuleAlter)] : []),
      versionMarker(db, FEATURE_SCHEMA_MARKER, FEATURE_SCHEMA_VERSION),
    ]);
    return;
  }

  if (versions.get(QUEUE_SCHEMA_MARKER) !== QUEUE_SCHEMA_VERSION) {
    const tables = ["healthcare_provider_profiles", "healthcare_queue_entries", "healthcare_queue_settings"];
    const tableColumns = new Map<string, Set<string>>();
    for (const table of tables) {
      const columns = await db.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
      tableColumns.set(table, new Set((columns.results ?? []).map((column) => column.name)));
    }
    const pendingStatements = queueLifecycleStatements.filter((statement) => {
      const alter = statement.match(/^ALTER TABLE `?([a-z_]+)`? ADD `?([a-z_]+)`?/i);
      return !alter || !tableColumns.get(alter[1])?.has(alter[2]);
    });
    await db.batch([
      ...pendingStatements.map((statement) => db.prepare(statement)),
      versionMarker(db, QUEUE_SCHEMA_MARKER, QUEUE_SCHEMA_VERSION),
    ]);
    return;
  }

  if (versions.get(RICH_MEDIA_SCHEMA_MARKER) !== RICH_MEDIA_SCHEMA_VERSION) {
    await db.batch([
      ...richMediaStatements.map((statement) => db.prepare(statement)),
      versionMarker(db, RICH_MEDIA_SCHEMA_MARKER, RICH_MEDIA_SCHEMA_VERSION),
    ]);
    return;
  }

  if (versions.get(EXTERNAL_AUTH_SCHEMA_MARKER) !== EXTERNAL_AUTH_SCHEMA_VERSION) {
    await db.batch([
      ...externalAuthStatements.map((statement) => db.prepare(statement)),
      versionMarker(db, EXTERNAL_AUTH_SCHEMA_MARKER, EXTERNAL_AUTH_SCHEMA_VERSION),
    ]);
    return;
  }

  if (versions.get(BASE_INDEX_MARKER) !== BASE_INDEX_VERSION) {
    await db.batch([
      ...baseIndexes.map((statement) => db.prepare(statement)),
      versionMarker(db, BASE_INDEX_MARKER, BASE_INDEX_VERSION),
    ]);
    return;
  }

  if (versions.get(COMMERCE_INDEX_MARKER) !== COMMERCE_INDEX_VERSION) {
    await db.batch([
      ...commerceIndexes.map((statement) => db.prepare(statement)),
      versionMarker(db, COMMERCE_INDEX_MARKER, COMMERCE_INDEX_VERSION),
    ]);
    return;
  }

  if (versions.get(FEATURE_INDEX_MARKER) !== FEATURE_INDEX_VERSION) {
    await db.batch([
      ...featureIndexes.map((statement) => db.prepare(statement)),
      versionMarker(db, FEATURE_INDEX_MARKER, FEATURE_INDEX_VERSION),
    ]);
    return;
  }

  databaseFullyReady = true;
}

/**
 * Sites normally applies Drizzle migrations during deployment. This guarded
 * initializer also repairs first-run or restored databases with no schema.
 */
export function ensureDatabaseReady(): Promise<void> {
  if (databaseFullyReady) return Promise.resolve();
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapDatabase().finally(() => {
      bootstrapPromise = null;
    });
  }
  return bootstrapPromise;
}
