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
});
