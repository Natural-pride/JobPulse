import { Router } from 'express';
import type Database from 'better-sqlite3';
import { roundCreateSchema, roundUpdateSchema } from '../validate.js';
import type { InterviewRound } from '../types.js';

export function createRoundsRouter(db: Database.Database): Router {
  const router = Router();

  // GET /api/opportunities/:id/rounds
  router.get('/opportunities/:id/rounds', (req, res) => {
    const oppId = Number(req.params.id);
    const rows = db
      .prepare(
        'SELECT * FROM interview_rounds WHERE opportunity_id = ? ORDER BY round_number ASC'
      )
      .all(oppId) as InterviewRound[];
    res.json(rows);
  });

  // POST /api/opportunities/:id/rounds
  router.post('/opportunities/:id/rounds', (req, res) => {
    const oppId = Number(req.params.id);
    const opp = db
      .prepare('SELECT id FROM opportunities WHERE id = ?')
      .get(oppId);
    if (!opp) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }
    const parse = roundCreateSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.message });
    }
    const data = parse.data;
    const stmt = db.prepare(`
      INSERT INTO interview_rounds (
        opportunity_id, round_number, round_type, format, location,
        scheduled_at, actual_at, duration_minutes, questions, my_performance,
        outcome, next_round_date, notes
      ) VALUES (
        @opportunity_id, @round_number, @round_type, @format, @location,
        @scheduled_at, @actual_at, @duration_minutes, @questions, @my_performance,
        @outcome, @next_round_date, @notes
      )
    `);
    const result = stmt.run({
      opportunity_id: oppId,
      round_number: data.round_number,
      round_type: data.round_type,
      format: data.format,
      location: data.location ?? null,
      scheduled_at: data.scheduled_at,
      actual_at: data.actual_at ?? null,
      duration_minutes: data.duration_minutes ?? null,
      questions: data.questions ?? null,
      my_performance: data.my_performance ?? null,
      outcome: data.outcome ?? 'pending',
      next_round_date: data.next_round_date ?? null,
      notes: data.notes ?? null,
    });
    const created = db
      .prepare('SELECT * FROM interview_rounds WHERE id = ?')
      .get(result.lastInsertRowid) as InterviewRound;
    res.status(201).json(created);
  });

  // PUT /api/rounds/:id
  router.put('/rounds/:id', (req, res) => {
    const id = Number(req.params.id);
    const parse = roundUpdateSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.message });
    }
    const existing = db
      .prepare('SELECT * FROM interview_rounds WHERE id = ?')
      .get(id) as InterviewRound | undefined;
    if (!existing) {
      return res.status(404).json({ error: 'Round not found' });
    }
    const data = parse.data;
    const merged = {
      round_number: data.round_number ?? existing.round_number,
      round_type: data.round_type ?? existing.round_type,
      format: data.format ?? existing.format,
      location: data.location !== undefined ? data.location : existing.location,
      scheduled_at: data.scheduled_at ?? existing.scheduled_at,
      actual_at: data.actual_at !== undefined ? data.actual_at : existing.actual_at,
      duration_minutes:
        data.duration_minutes !== undefined
          ? data.duration_minutes
          : existing.duration_minutes,
      questions:
        data.questions !== undefined ? data.questions : existing.questions,
      my_performance:
        data.my_performance !== undefined
          ? data.my_performance
          : existing.my_performance,
      outcome: data.outcome ?? existing.outcome,
      next_round_date:
        data.next_round_date !== undefined
          ? data.next_round_date
          : existing.next_round_date,
      notes: data.notes !== undefined ? data.notes : existing.notes,
    };
    db.prepare(
      `UPDATE interview_rounds SET
        round_number=@round_number, round_type=@round_type, format=@format,
        location=@location, scheduled_at=@scheduled_at, actual_at=@actual_at,
        duration_minutes=@duration_minutes, questions=@questions,
        my_performance=@my_performance, outcome=@outcome,
        next_round_date=@next_round_date, notes=@notes,
        updated_at=datetime('now')
      WHERE id=@id`
    ).run({ ...merged, id });
    const updated = db
      .prepare('SELECT * FROM interview_rounds WHERE id = ?')
      .get(id) as InterviewRound;
    res.json(updated);
  });

  // DELETE /api/rounds/:id
  router.delete('/rounds/:id', (req, res) => {
    const id = Number(req.params.id);
    const result = db
      .prepare('DELETE FROM interview_rounds WHERE id = ?')
      .run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Round not found' });
    }
    res.status(204).end();
  });

  return router;
}
