import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const openInstances = new Set<Database.Database>();

let db: Database.Database | null = null;

export function initDb(dbPath: string): Database.Database {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const instance = new Database(dbPath);
  openInstances.add(instance);
  instance.pragma('journal_mode = WAL');
  instance.pragma('foreign_keys = ON');

  instance.exec(`
    CREATE TABLE IF NOT EXISTS opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      position_name TEXT NOT NULL,
      province TEXT,
      city TEXT,
      address TEXT,
      salary_range TEXT,
      benefits TEXT,
      weekend_policy TEXT,
      work_hours TEXT,
      jd_text TEXT,
      jd_url TEXT,
      source TEXT,
      contact_info TEXT,
      status TEXT NOT NULL DEFAULT 'in_progress',
      final_salary TEXT,
      final_benefits TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS interview_rounds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opportunity_id INTEGER NOT NULL,
      round_number INTEGER NOT NULL,
      round_type TEXT NOT NULL,
      format TEXT NOT NULL,
      location TEXT,
      scheduled_at TEXT NOT NULL,
      actual_at TEXT,
      duration_minutes INTEGER,
      questions TEXT,
      my_performance TEXT,
      outcome TEXT NOT NULL DEFAULT 'pending',
      next_round_date TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_rounds_opportunity
      ON interview_rounds(opportunity_id);
  `);

  // One-shot migrations for existing opportunities tables.
  const cols = instance
    .prepare("PRAGMA table_info(opportunities)")
    .all() as Array<{ name: string }>;

  // 1. Add `province` column. Old rows keep province = NULL; the UI handles it.
  if (!cols.some((c) => c.name === 'province')) {
    instance.exec(`ALTER TABLE opportunities ADD COLUMN province TEXT`);
  }

  // 2. has_weekends_off (INTEGER 0/1) → weekend_policy (TEXT enum).
  //    0 → NULL, 1 → 'double_off'. Drop the legacy column on SQLite 3.35+.
  const hasOld = cols.some((c) => c.name === 'has_weekends_off');
  const hasNew = cols.some((c) => c.name === 'weekend_policy');
  if (hasOld && !hasNew) {
    instance.exec(`ALTER TABLE opportunities ADD COLUMN weekend_policy TEXT`);
    instance.exec(
      `UPDATE opportunities SET weekend_policy = CASE has_weekends_off WHEN 1 THEN 'double_off' ELSE NULL END`
    );
    try {
      instance.exec(`ALTER TABLE opportunities DROP COLUMN has_weekends_off`);
    } catch {
      // Older SQLite (<3.35) doesn't support DROP COLUMN. The legacy column
      // becomes a harmless unused shadow column; the new column is the source of truth.
    }
  }

  return instance;
}

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'jobpulse.db');
    db = initDb(dbPath);
  }
  return db;
}

export function setDbForTesting(instance: Database.Database): void {
  db = instance;
  openInstances.add(instance);
}

// Register a vitest afterEach hook to close any tracked database connections
// between tests. This prevents file locks from carrying over between tests on
// platforms (like Windows) where an open file cannot be unlinked.
//
// We use a dynamic import so this module can also be loaded in production
// (where vitest is not installed as a dependency). The dynamic import is
// awaited at module top level so the hook is registered before any test runs.
try {
  const { afterEach } = await import('vitest');
  afterEach(() => {
    for (const inst of openInstances) {
      try {
        inst.close();
      } catch {
        // already closed or other error; ignore
      }
    }
    openInstances.clear();
  });
} catch {
  // vitest not available (e.g., production); skip hook registration
}
