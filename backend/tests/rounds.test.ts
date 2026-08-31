import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import type Database from 'better-sqlite3';
import { initDb } from '../src/db.js';
import { createApp } from '../src/app.js';
import { unlinkSync, existsSync } from 'node:fs';
import path from 'node:path';

const TEST_DB = path.join(process.cwd(), 'data', 'test-rounds.sqlite');

describe('Rounds API', () => {
  let db: Database.Database;
  let app: ReturnType<typeof createApp>;
  let opportunityId: number;

  beforeEach(async () => {
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
    db = initDb(TEST_DB);
    app = createApp(db);
    const create = await request(app)
      .post('/api/opportunities')
      .send({ company_name: 'Acme', position_name: 'Backend' });
    opportunityId = create.body.id;
  });

  afterEach(() => {
    db.close();
  });

  it('POST creates a round linked to the opportunity', async () => {
    const res = await request(app)
      .post(`/api/opportunities/${opportunityId}/rounds`)
      .send({
        round_number: 1,
        round_type: 'tech_1',
        format: 'online_video',
        scheduled_at: '2026-09-01 14:00:00',
      });
    expect(res.status).toBe(201);
    expect(res.body.opportunity_id).toBe(opportunityId);
    expect(res.body.outcome).toBe('pending');
  });

  it('GET lists rounds for an opportunity ordered by round_number', async () => {
    await request(app)
      .post(`/api/opportunities/${opportunityId}/rounds`)
      .send({ round_number: 2, round_type: 'final', format: 'onsite', scheduled_at: '2026-09-05 10:00:00' });
    await request(app)
      .post(`/api/opportunities/${opportunityId}/rounds`)
      .send({ round_number: 1, round_type: 'tech_1', format: 'online_video', scheduled_at: '2026-09-01 14:00:00' });
    const res = await request(app).get(`/api/opportunities/${opportunityId}/rounds`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].round_number).toBe(1);
    expect(res.body[1].round_number).toBe(2);
  });

  it('POST returns 404 if opportunity does not exist', async () => {
    const res = await request(app)
      .post('/api/opportunities/999/rounds')
      .send({ round_number: 1, round_type: 'tech_1', format: 'online_video', scheduled_at: '2026-09-01 14:00:00' });
    expect(res.status).toBe(404);
  });

  it('PUT updates a round outcome', async () => {
    const create = await request(app)
      .post(`/api/opportunities/${opportunityId}/rounds`)
      .send({ round_number: 1, round_type: 'tech_1', format: 'online_video', scheduled_at: '2026-09-01 14:00:00' });
    const id = create.body.id;
    const res = await request(app)
      .put(`/api/rounds/${id}`)
      .send({ outcome: 'passed', questions: 'TCP 三次握手' });
    expect(res.status).toBe(200);
    expect(res.body.outcome).toBe('passed');
    expect(res.body.questions).toBe('TCP 三次握手');
  });

  it('DELETE removes a round', async () => {
    const create = await request(app)
      .post(`/api/opportunities/${opportunityId}/rounds`)
      .send({ round_number: 1, round_type: 'tech_1', format: 'online_video', scheduled_at: '2026-09-01 14:00:00' });
    const id = create.body.id;
    const del = await request(app).delete(`/api/rounds/${id}`);
    expect(del.status).toBe(204);
  });
});
