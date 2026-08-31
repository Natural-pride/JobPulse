import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import type Database from 'better-sqlite3';
import { initDb } from '../src/db.js';
import { createApp } from '../src/app.js';
import { unlinkSync, existsSync } from 'node:fs';
import path from 'node:path';

const TEST_DB = path.join(process.cwd(), 'data', 'test-opp.sqlite');

describe('Opportunities API', () => {
  let db: Database.Database;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
    db = initDb(TEST_DB);
    app = createApp(db);
  });

  afterEach(() => {
    db.close();
  });

  it('GET /api/opportunities returns empty array initially', async () => {
    const res = await request(app).get('/api/opportunities');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST /api/opportunities creates and returns the opportunity', async () => {
    const res = await request(app)
      .post('/api/opportunities')
      .send({ company_name: 'Acme', position_name: 'Backend' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.company_name).toBe('Acme');
    expect(res.body.status).toBe('in_progress');
  });

  it('POST rejects missing company_name', async () => {
    const res = await request(app)
      .post('/api/opportunities')
      .send({ position_name: 'Backend' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('GET /api/opportunities/:id returns one opportunity', async () => {
    const create = await request(app)
      .post('/api/opportunities')
      .send({ company_name: 'Acme', position_name: 'Backend' });
    const id = create.body.id;
    const res = await request(app).get(`/api/opportunities/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.company_name).toBe('Acme');
  });

  it('GET /api/opportunities/:id 404 when not found', async () => {
    const res = await request(app).get('/api/opportunities/999');
    expect(res.status).toBe(404);
  });

  it('PUT /api/opportunities/:id updates fields', async () => {
    const create = await request(app)
      .post('/api/opportunities')
      .send({ company_name: 'Acme', position_name: 'Backend' });
    const id = create.body.id;
    const res = await request(app)
      .put(`/api/opportunities/${id}`)
      .send({ status: 'offered', final_salary: '15K*14' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('offered');
    expect(res.body.final_salary).toBe('15K*14');
    expect(res.body.company_name).toBe('Acme'); // unchanged
  });

  it('DELETE /api/opportunities/:id removes the row', async () => {
    const create = await request(app)
      .post('/api/opportunities')
      .send({ company_name: 'Acme', position_name: 'Backend' });
    const id = create.body.id;
    const del = await request(app).delete(`/api/opportunities/${id}`);
    expect(del.status).toBe(204);
    const get = await request(app).get(`/api/opportunities/${id}`);
    expect(get.status).toBe(404);
  });

  it('awaiting_response status and resume_submitted_at roundtrip', async () => {
    const create = await request(app)
      .post('/api/opportunities')
      .send({
        company_name: '投递公司',
        position_name: '后端',
        status: 'awaiting_response',
        resume_submitted_at: '2026-08-28 10:00:00',
      });
    expect(create.status).toBe(201);
    expect(create.body.status).toBe('awaiting_response');
    expect(create.body.resume_submitted_at).toBe('2026-08-28 10:00:00');

    const get = await request(app).get(`/api/opportunities/${create.body.id}`);
    expect(get.body.status).toBe('awaiting_response');
    expect(get.body.resume_submitted_at).toBe('2026-08-28 10:00:00');

    // Update to in_progress + new resume date
    const update = await request(app)
      .put(`/api/opportunities/${create.body.id}`)
      .send({ status: 'in_progress', resume_submitted_at: null });
    expect(update.body.status).toBe('in_progress');
    expect(update.body.resume_submitted_at).toBeNull();
  });

  it('rejects invalid awaiting_response-like status', async () => {
    const res = await request(app)
      .post('/api/opportunities')
      .send({
        company_name: 'X',
        position_name: 'Y',
        status: 'waiting',
      });
    expect(res.status).toBe(400);
  });

  it('weekend_policy roundtrips on create/get/update', async () => {
    const create = await request(app)
      .post('/api/opportunities')
      .send({
        company_name: 'Acme',
        position_name: 'Backend',
        weekend_policy: 'alternating',
      });
    expect(create.status).toBe(201);
    expect(create.body.weekend_policy).toBe('alternating');

    const get = await request(app).get(`/api/opportunities/${create.body.id}`);
    expect(get.body.weekend_policy).toBe('alternating');

    const update = await request(app)
      .put(`/api/opportunities/${create.body.id}`)
      .send({ weekend_policy: 'single_off' });
    expect(update.status).toBe(200);
    expect(update.body.weekend_policy).toBe('single_off');

    const clear = await request(app)
      .put(`/api/opportunities/${create.body.id}`)
      .send({ weekend_policy: null });
    expect(clear.body.weekend_policy).toBeNull();
  });

  it('rejects unknown weekend_policy values', async () => {
    const res = await request(app)
      .post('/api/opportunities')
      .send({
        company_name: 'Acme',
        position_name: 'Backend',
        weekend_policy: 'not_a_real_value',
      });
    expect(res.status).toBe(400);
  });

  it('province roundtrips on create/get/update', async () => {
    const create = await request(app)
      .post('/api/opportunities')
      .send({
        company_name: 'Acme',
        position_name: 'Backend',
        province: '广东省',
        city: '深圳市南山区',
        address: '枫信科创中心 4 楼 466',
      });
    expect(create.status).toBe(201);
    expect(create.body.province).toBe('广东省');
    expect(create.body.city).toBe('深圳市南山区');
    expect(create.body.address).toBe('枫信科创中心 4 楼 466');

    const get = await request(app).get(`/api/opportunities/${create.body.id}`);
    expect(get.body.province).toBe('广东省');
    expect(get.body.city).toBe('深圳市南山区');

    const update = await request(app)
      .put(`/api/opportunities/${create.body.id}`)
      .send({ province: '北京市', city: '北京市朝阳区' });
    expect(update.status).toBe(200);
    expect(update.body.province).toBe('北京市');
    expect(update.body.city).toBe('北京市朝阳区');
  });
});

describe('Opportunities pagination', () => {
  let db: Database.Database;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
    db = initDb(TEST_DB);
    app = createApp(db);
    // Seed 25 opportunities with mixed statuses
    const insert = db.prepare(
      'INSERT INTO opportunities (company_name, position_name, status, created_at) VALUES (?, ?, ?, ?)'
    );
    for (let i = 0; i < 25; i++) {
      const status = ['in_progress', 'offered', 'rejected', 'withdrawn'][i % 4];
      const day = String(10 + (i % 28)).padStart(2, '0');
      insert.run(`Co ${i}`, `Role ${i}`, status, `2026-08-${day} 10:00:00`);
    }
  });

  afterEach(() => {
    db.close();
  });

  it('returns plain array when no pagination params (back-compat)', async () => {
    const res = await request(app).get('/api/opportunities');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(25);
  });

  it('returns paged result when page is provided', async () => {
    const res = await request(app).get('/api/opportunities?page=1&pageSize=10');
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(10);
    expect(res.body.total).toBe(25);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(10);
    expect(res.body.hasMore).toBe(true);
  });

  it('returns correct page 3 with hasMore=false on last page', async () => {
    const res = await request(app).get('/api/opportunities?page=3&pageSize=10');
    expect(res.body.items.length).toBe(5); // 25 total - 20 already
    expect(res.body.hasMore).toBe(false);
  });

  it('filters by status', async () => {
    const res = await request(app).get(
      '/api/opportunities?status=in_progress&pageSize=100'
    );
    expect(res.body.total).toBe(7); // 25 with i%4 === 0 → 0,4,8,12,16,20,24 = 7
    expect(res.body.items.every((o: { status: string }) => o.status === 'in_progress')).toBe(true);
  });

  it('searches by company_name case-insensitive', async () => {
    const res = await request(app).get(
      '/api/opportunities?search=CO%201&pageSize=100'
    );
    // Co 1, CO 10, CO 11, ... CO 19 (and any with that substring)
    // "Co 1" matches "Co 1", "Co 10"-"Co 19" (case-insensitive)
    expect(res.body.total).toBeGreaterThan(0);
    expect(
      res.body.items.every((o: { company_name: string }) =>
        o.company_name.toLowerCase().includes('co 1')
      )
    ).toBe(true);
  });

  it('rejects invalid status', async () => {
    const res = await request(app).get('/api/opportunities?status=invalid');
    expect(res.status).toBe(400);
  });

  it('rejects page=0', async () => {
    const res = await request(app).get('/api/opportunities?page=0');
    expect(res.status).toBe(400);
  });

  it('rejects pageSize > 100', async () => {
    const res = await request(app).get('/api/opportunities?pageSize=200');
    expect(res.status).toBe(400);
  });

  it('GET /sources returns distinct sources sorted by frequency', async () => {
    const insert = db.prepare(
      'INSERT INTO opportunities (company_name, position_name, source, status, created_at) VALUES (?, ?, ?, ?, ?)'
    );
    insert.run('A', 'A1', 'BOSS', 'in_progress', '2026-08-01 10:00:00');
    insert.run('B', 'B1', 'BOSS', 'in_progress', '2026-08-02 10:00:00');
    insert.run('C', 'C1', '朋友内推', 'in_progress', '2026-08-03 10:00:00');
    insert.run('D', 'D1', '朋友内推', 'in_progress', '2026-08-04 10:00:00');
    insert.run('E', 'E1', '朋友内推', 'in_progress', '2026-08-05 10:00:00');
    insert.run('F', 'F1', 'V2EX', 'in_progress', '2026-08-06 10:00:00');
    insert.run('G', 'G1', null, 'in_progress', '2026-08-07 10:00:00');
    insert.run('H', 'H1', '', 'in_progress', '2026-08-08 10:00:00');

    const res = await request(app).get('/api/opportunities/sources');
    expect(res.status).toBe(200);
    // Sorted by count desc: 朋友内推 (3) > BOSS (2) > V2EX (1)
    expect(res.body).toEqual(['朋友内推', 'BOSS', 'V2EX']);
  });
});

describe('Opportunities sort by interview time', () => {
  let db: Database.Database;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
    db = initDb(TEST_DB);
    app = createApp(db);
    // Seed 3 opportunities, each created on the same day, but with rounds
    // at different times. Sort should be: most-recent interview first.
    const insertOpp = db.prepare(
      'INSERT INTO opportunities (company_name, position_name, status, created_at) VALUES (?, ?, ?, ?)'
    );
    const insertRound = db.prepare(
      `INSERT INTO interview_rounds
         (opportunity_id, round_number, round_type, format, scheduled_at, actual_at, outcome)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const CREATED = '2026-08-01 10:00:00';

    // A: created first, no rounds → should sort by created_at (last)
    const a = insertOpp.run('Alpha', 'A', 'in_progress', CREATED).lastInsertRowid as number;
    // B: created second, has a round on 08-15 (older)
    const b = insertOpp.run('Bravo', 'B', 'in_progress', CREATED).lastInsertRowid as number;
    insertRound.run(b, 1, 'technical', 'online', '2026-08-15 10:00:00', '2026-08-15 11:00:00', 'passed');
    // C: created third, has a round on 08-25 (newest) — should be first
    const c = insertOpp.run('Charlie', 'C', 'in_progress', CREATED).lastInsertRowid as number;
    insertRound.run(c, 1, 'technical', 'online', '2026-08-25 10:00:00', '2026-08-25 11:00:00', 'passed');

    // (a is unused but kept for clarity)
    void a;
  });

  afterEach(() => {
    db.close();
  });

  it('back-compat: returns most-recent-interview first', async () => {
    const res = await request(app).get('/api/opportunities');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const names = (res.body as { company_name: string }[]).map((o) => o.company_name);
    expect(names[0]).toBe('Charlie');
    expect(names[1]).toBe('Bravo');
    expect(names[2]).toBe('Alpha');
  });

  it('paged: also sorts by most-recent-interview', async () => {
    const res = await request(app).get('/api/opportunities?page=1&pageSize=10');
    const names = (res.body.items as { company_name: string }[]).map((o) => o.company_name);
    expect(names[0]).toBe('Charlie');
    expect(names[1]).toBe('Bravo');
    expect(names[2]).toBe('Alpha');
  });

  it('falls back to scheduled_at when no actual_at', async () => {
    // Add a round to Alpha with only scheduled_at, dated 09-01.
    // Alpha should jump to the top.
    db.prepare(
      `INSERT INTO interview_rounds
         (opportunity_id, round_number, round_type, format, scheduled_at, actual_at, outcome)
       VALUES ((SELECT id FROM opportunities WHERE company_name = 'Alpha'),
               1, 'technical', 'online', '2026-09-01 10:00:00', NULL, 'pending')`
    ).run();
    const res = await request(app).get('/api/opportunities');
    const names = (res.body as { company_name: string }[]).map((o) => o.company_name);
    expect(names[0]).toBe('Alpha');
    expect(names[1]).toBe('Charlie');
  });
});
