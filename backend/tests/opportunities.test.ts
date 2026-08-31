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
});
