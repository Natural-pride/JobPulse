import { describe, it, expect, beforeEach } from 'vitest';
import { initDb } from '../src/db.js';
import { unlinkSync, existsSync } from 'node:fs';
import path from 'node:path';

const TEST_DB = path.join(process.cwd(), 'data', 'test-db.sqlite');

describe('initDb', () => {
  beforeEach(() => {
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  it('creates opportunities and interview_rounds tables', () => {
    const db = initDb(TEST_DB);
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[];
    const tableNames = tables.map((t) => t.name);
    expect(tableNames).toContain('opportunities');
    expect(tableNames).toContain('interview_rounds');
  });

  it('enables foreign keys', () => {
    const db = initDb(TEST_DB);
    const result = db.pragma('foreign_keys', { simple: true });
    expect(result).toBe(1);
  });

  it('sets default status to in_progress on new opportunity', () => {
    const db = initDb(TEST_DB);
    const stmt = db.prepare(
      'INSERT INTO opportunities (company_name, position_name) VALUES (?, ?)'
    );
    const result = stmt.run('Acme', 'Engineer');
    const row = db
      .prepare('SELECT status FROM opportunities WHERE id = ?')
      .get(result.lastInsertRowid) as { status: string };
    expect(row.status).toBe('in_progress');
  });

  it('cascades delete from opportunity to rounds', () => {
    const db = initDb(TEST_DB);
    const oppResult = db
      .prepare('INSERT INTO opportunities (company_name, position_name) VALUES (?, ?)')
      .run('Acme', 'Engineer');
    const oppId = Number(oppResult.lastInsertRowid);
    db.prepare(
      'INSERT INTO interview_rounds (opportunity_id, round_number, round_type, format, scheduled_at) VALUES (?, ?, ?, ?, ?)'
    ).run(oppId, 1, 'tech_1', 'online_video', '2026-09-01 10:00:00');

    db.prepare('DELETE FROM opportunities WHERE id = ?').run(oppId);
    const rounds = db
      .prepare('SELECT * FROM interview_rounds WHERE opportunity_id = ?')
      .all(oppId);
    expect(rounds).toHaveLength(0);
  });
});
