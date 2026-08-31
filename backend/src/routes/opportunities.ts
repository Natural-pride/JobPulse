import { Router } from 'express';
import type Database from 'better-sqlite3';
import { z } from 'zod';
import {
  opportunityCreateSchema,
  opportunityUpdateSchema,
} from '../validate.js';
import type { Opportunity, OpportunityStatus } from '../types.js';

export interface ListResult {
  items: Opportunity[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum([
      'in_progress',
      'awaiting_response',
      'offered',
      'accepted',
      'rejected',
      'withdrawn',
      'declined',
      'accepted_then_left',
    ])
    .optional(),
  search: z.string().trim().min(1).max(100).optional(),
});

/**
 * Sort opportunities by their most recent interview time, newest first.
 * "Interview time" = the latest of (actual_at, scheduled_at) across all rounds
 * for that opportunity. Falls back to created_at when there are no rounds,
 * and uses created_at as a stable tiebreak.
 */
const INTERVIEW_TIME_ORDER_SQL = `ORDER BY COALESCE(
  (SELECT MAX(COALESCE(actual_at, scheduled_at))
     FROM interview_rounds
     WHERE opportunity_id = opportunities.id),
  created_at
) DESC, created_at DESC`;

export function createOpportunitiesRouter(db: Database.Database): Router {
  const router = Router();

  // GET /api/opportunities
  // Optional query params: page, pageSize, status, search
  // - No params → return all (back-compat for dashboard fetch)
  // - page provided → return paginated response { items, total, page, pageSize, hasMore }
  router.get('/', (req, res) => {
    const raw = req.query as Record<string, unknown>;
    const wantsPaging =
      raw.page !== undefined ||
      raw.pageSize !== undefined ||
      raw.status !== undefined ||
      raw.search !== undefined;

    if (!wantsPaging) {
      const rows = db
        .prepare(`SELECT * FROM opportunities ${INTERVIEW_TIME_ORDER_SQL}`)
        .all() as Opportunity[];
      res.json(rows);
      return;
    }

    const parsed = listQuerySchema.safeParse(raw);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const { page, pageSize, status, search } = parsed.data;
    const offset = (page - 1) * pageSize;

    const where: string[] = [];
    const params: unknown[] = [];
    if (status) {
      where.push('status = ?');
      params.push(status);
    }
    if (search) {
      where.push('(company_name LIKE ? OR position_name LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const totalRow = db
      .prepare(`SELECT COUNT(*) as n FROM opportunities ${whereSql}`)
      .get(...params) as { n: number };
    const rows = db
      .prepare(
        `SELECT * FROM opportunities ${whereSql} ${INTERVIEW_TIME_ORDER_SQL} LIMIT ? OFFSET ?`
      )
      .all(...params, pageSize, offset) as Opportunity[];

    const result: ListResult = {
      items: rows,
      total: totalRow.n,
      page,
      pageSize,
      hasMore: offset + rows.length < totalRow.n,
    };
    res.json(result);
  });

  // GET /api/opportunities/sources
  // Returns distinct, non-empty source values (sorted by frequency desc),
  // so the form can offer "ever used" suggestions beyond the built-in set.
  // Mounted BEFORE the `/:id` route so the literal path doesn't get caught.
  router.get('/sources', (_req, res) => {
    const rows = db
      .prepare(
        `SELECT source, COUNT(*) as n
         FROM opportunities
         WHERE source IS NOT NULL AND TRIM(source) != ''
         GROUP BY source
         ORDER BY n DESC, source ASC`
      )
      .all() as Array<{ source: string; n: number }>;
    res.json(rows.map((r) => r.source));
  });

  // GET /api/opportunities/:id
  router.get('/:id', (req, res) => {
    const id = Number(req.params.id);
    const row = db
      .prepare('SELECT * FROM opportunities WHERE id = ?')
      .get(id) as Opportunity | undefined;
    if (!row) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }
    res.json(row);
  });

  // POST /api/opportunities
  router.post('/', (req, res) => {
    const parse = opportunityCreateSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.message });
    }
    const data = parse.data;
    const stmt = db.prepare(`
      INSERT INTO opportunities (
        company_name, position_name, province, city, address, salary_range, benefits,
        weekend_policy, work_hours, jd_text, jd_url, source, contact_info,
        status, final_salary, final_benefits, notes, resume_submitted_at
      ) VALUES (
        @company_name, @position_name, @province, @city, @address, @salary_range, @benefits,
        @weekend_policy, @work_hours, @jd_text, @jd_url, @source, @contact_info,
        @status, @final_salary, @final_benefits, @notes, @resume_submitted_at
      )
    `);
    const result = stmt.run({
      company_name: data.company_name,
      position_name: data.position_name,
      province: data.province ?? null,
      city: data.city ?? null,
      address: data.address ?? null,
      salary_range: data.salary_range ?? null,
      benefits: data.benefits ?? null,
      weekend_policy: data.weekend_policy ?? null,
      work_hours: data.work_hours ?? null,
      jd_text: data.jd_text ?? null,
      jd_url: data.jd_url ?? null,
      source: data.source ?? null,
      contact_info: data.contact_info ?? null,
      status: data.status ?? 'in_progress',
      final_salary: data.final_salary ?? null,
      final_benefits: data.final_benefits ?? null,
      notes: data.notes ?? null,
      resume_submitted_at: data.resume_submitted_at ?? null,
    });
    const created = db
      .prepare('SELECT * FROM opportunities WHERE id = ?')
      .get(result.lastInsertRowid) as Opportunity;
    res.status(201).json(created);
  });

  // PUT /api/opportunities/:id
  router.put('/:id', (req, res) => {
    const id = Number(req.params.id);
    const parse = opportunityUpdateSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.message });
    }
    const existing = db
      .prepare('SELECT * FROM opportunities WHERE id = ?')
      .get(id) as Opportunity | undefined;
    if (!existing) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }
    const data = parse.data;
    const merged = {
      company_name: data.company_name ?? existing.company_name,
      position_name: data.position_name ?? existing.position_name,
      province: data.province !== undefined ? data.province : existing.province,
      city: data.city !== undefined ? data.city : existing.city,
      address: data.address !== undefined ? data.address : existing.address,
      salary_range:
        data.salary_range !== undefined ? data.salary_range : existing.salary_range,
      benefits: data.benefits !== undefined ? data.benefits : existing.benefits,
      weekend_policy:
        data.weekend_policy !== undefined
          ? data.weekend_policy
          : existing.weekend_policy,
      work_hours:
        data.work_hours !== undefined ? data.work_hours : existing.work_hours,
      jd_text: data.jd_text !== undefined ? data.jd_text : existing.jd_text,
      jd_url: data.jd_url !== undefined ? data.jd_url : existing.jd_url,
      source: data.source !== undefined ? data.source : existing.source,
      contact_info:
        data.contact_info !== undefined ? data.contact_info : existing.contact_info,
      status: data.status ?? existing.status,
      final_salary:
        data.final_salary !== undefined ? data.final_salary : existing.final_salary,
      final_benefits:
        data.final_benefits !== undefined
          ? data.final_benefits
          : existing.final_benefits,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      resume_submitted_at:
        data.resume_submitted_at !== undefined
          ? data.resume_submitted_at
          : existing.resume_submitted_at,
    };
    db.prepare(
      `UPDATE opportunities SET
        company_name=@company_name, position_name=@position_name,
        province=@province, city=@city, address=@address, salary_range=@salary_range,
        benefits=@benefits, weekend_policy=@weekend_policy,
        work_hours=@work_hours, jd_text=@jd_text, jd_url=@jd_url,
        source=@source, contact_info=@contact_info, status=@status,
        final_salary=@final_salary, final_benefits=@final_benefits,
        notes=@notes, resume_submitted_at=@resume_submitted_at, updated_at=datetime('now')
      WHERE id=@id`
    ).run({ ...merged, id });
    const updated = db
      .prepare('SELECT * FROM opportunities WHERE id = ?')
      .get(id) as Opportunity;
    res.json(updated);
  });

  // DELETE /api/opportunities/:id
  router.delete('/:id', (req, res) => {
    const id = Number(req.params.id);
    const result = db
      .prepare('DELETE FROM opportunities WHERE id = ?')
      .run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }
    res.status(204).end();
  });

  return router;
}
