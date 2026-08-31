import { Router } from 'express';
import type Database from 'better-sqlite3';
import type { InterviewRound, Opportunity } from '../types.js';

export type ActionType =
  | 'follow_up'
  | 'add_next_round'
  | 'fill_offer'
  | 'pending_overdue'
  | 'status_inconsistent';

export type Severity = 'red' | 'yellow' | 'blue';

export interface ActionItem {
  type: ActionType;
  severity: Severity;
  opportunity_id: number;
  company: string;
  position: string;
  message: string;
  hint: string;
  /** Days since last activity, when relevant. */
  days_idle?: number;
}

const STALE_DAYS_YELLOW = 7;
const STALE_DAYS_RED = 14;
const PENDING_OVERDUE_DAYS = 1;
/** `awaiting_response` (resume submitted, waiting for HR to schedule). */
const AWAITING_DAYS_YELLOW = 3;
const AWAITING_DAYS_RED = 5;

function parseDate(s: string | null | undefined): number | null {
  if (!s) return null;
  const t = new Date(s.replace(' ', 'T') + (s.includes('T') ? '' : 'Z')).getTime();
  return Number.isFinite(t) ? t : null;
}

function computeLastActivity(
  opp: Opportunity,
  rounds: InterviewRound[]
): number | null {
  const candidates: number[] = [];
  for (const r of rounds) {
    const actual = parseDate(r.actual_at);
    if (actual !== null) candidates.push(actual);
    else {
      const scheduled = parseDate(r.scheduled_at);
      if (scheduled !== null) candidates.push(scheduled);
    }
  }
  const updated = parseDate(opp.updated_at);
  if (updated !== null) candidates.push(updated);
  if (candidates.length === 0) return null;
  return Math.max(...candidates);
}

const SEVERITY_ORDER: Record<Severity, number> = { red: 0, yellow: 1, blue: 2 };

export function computeActionItems(
  opportunities: Opportunity[],
  roundsByOpp: Map<number, InterviewRound[]>,
  now: number = Date.now()
): ActionItem[] {
  const items: ActionItem[] = [];

  for (const opp of opportunities) {
    // Only check active opportunities. Final states are intentional closures
    // — surfacing them as "needs attention" would be noise.
    if (
      opp.status === 'rejected' ||
      opp.status === 'withdrawn' ||
      opp.status === 'declined' ||
      opp.status === 'accepted_then_left'
    ) {
      continue;
    }

    const rounds = roundsByOpp.get(opp.id) ?? [];
    const sortedRounds = [...rounds].sort((a, b) => a.round_number - b.round_number);

    // Rule: missing final_salary on offer/accepted
    if (opp.status === 'offered' || opp.status === 'accepted') {
      if (!opp.final_salary) {
        items.push({
          type: 'fill_offer',
          severity: 'red',
          opportunity_id: opp.id,
          company: opp.company_name,
          position: opp.position_name,
          message: 'Offer 状态未填最终薪资',
          hint: '点击补充薪资和福利',
        });
      }
    }

    // Rule: stale (no recent activity)
    const lastActivity = computeLastActivity(opp, sortedRounds);
    if (lastActivity !== null) {
      const daysIdle = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
      if (daysIdle >= STALE_DAYS_RED) {
        items.push({
          type: 'follow_up',
          severity: 'red',
          opportunity_id: opp.id,
          company: opp.company_name,
          position: opp.position_name,
          message: `${daysIdle} 天没更新了`,
          hint: '建议跟进一下 HR',
          days_idle: daysIdle,
        });
      } else if (daysIdle >= STALE_DAYS_YELLOW) {
        items.push({
          type: 'follow_up',
          severity: 'yellow',
          opportunity_id: opp.id,
          company: opp.company_name,
          position: opp.position_name,
          message: `${daysIdle} 天没更新了`,
          hint: '可考虑跟进',
          days_idle: daysIdle,
        });
      }
    }

    // Rule: awaiting_response — resume submitted, no interview scheduled yet.
    //       If `resume_submitted_at` is known, use it; otherwise fall back to
    //       the opportunity's created_at. 3d → yellow "follow up", 5d → red
    //       "almost certainly ghosted, suggest marking as rejected".
    if (opp.status === 'awaiting_response') {
      const submittedTs = parseDate(opp.resume_submitted_at) ?? parseDate(opp.created_at);
      if (submittedTs !== null) {
        const daysWaiting = Math.floor((now - submittedTs) / (1000 * 60 * 60 * 24));
        if (daysWaiting >= AWAITING_DAYS_RED) {
          items.push({
            type: 'follow_up',
            severity: 'red',
            opportunity_id: opp.id,
            company: opp.company_name,
            position: opp.position_name,
            message: `简历已投 ${daysWaiting} 天无回应`,
            hint: '大概率已被默拒，建议标为「未通过」',
            days_idle: daysWaiting,
          });
        } else if (daysWaiting >= AWAITING_DAYS_YELLOW) {
          items.push({
            type: 'follow_up',
            severity: 'yellow',
            opportunity_id: opp.id,
            company: opp.company_name,
            position: opp.position_name,
            message: `简历已投 ${daysWaiting} 天无回应`,
            hint: '可主动跟进一下 HR',
            days_idle: daysWaiting,
          });
        }
      }
    }

    // Rule: pending round overdue (scheduled in past, still 'pending' outcome)
    if (opp.status === 'in_progress') {
      for (const r of sortedRounds) {
        if (r.outcome !== 'pending') continue;
        const scheduled = parseDate(r.scheduled_at);
        if (scheduled === null) continue;
        const daysOverdue = Math.floor((now - scheduled) / (1000 * 60 * 60 * 24));
        if (daysOverdue >= PENDING_OVERDUE_DAYS) {
          items.push({
            type: 'pending_overdue',
            severity: 'red',
            opportunity_id: opp.id,
            company: opp.company_name,
            position: opp.position_name,
            message: `第 ${r.round_number} 轮已过 ${daysOverdue} 天未标记结果`,
            hint: '补录实际面试结果',
          });
          break; // one per opportunity is enough
        }
      }
    }

    // Rule: latest round passed but no follow-up (status still in_progress, no pending round)
    if (opp.status === 'in_progress' && sortedRounds.length > 0) {
      const lastRound = sortedRounds[sortedRounds.length - 1];
      if (lastRound.outcome === 'passed') {
        const hasPending = sortedRounds.some((r) => r.outcome === 'pending');
        if (!hasPending) {
          items.push({
            type: 'add_next_round',
            severity: 'blue',
            opportunity_id: opp.id,
            company: opp.company_name,
            position: opp.position_name,
            message: `第 ${lastRound.round_number} 轮已通过，未添加下一轮`,
            hint: '可补下一轮，或改成 Offer 状态',
          });
        }
      }
    }

    // Rule: status inconsistent (passed rounds but final outcome not positive)
    // Skipped for now — too noisy without more state machine rules.
  }

  // Sort: red first, then yellow, then blue. Within same severity, more idle days first.
  items.sort((a, b) => {
    const s = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (s !== 0) return s;
    return (b.days_idle ?? 0) - (a.days_idle ?? 0);
  });

  return items;
}

export function createActionItemsRouter(db: Database.Database): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    const opps = db
      .prepare('SELECT * FROM opportunities')
      .all() as Opportunity[];
    const rows = db.prepare('SELECT * FROM interview_rounds').all() as InterviewRound[];
    const roundsByOpp = new Map<number, InterviewRound[]>();
    for (const r of rows) {
      const arr = roundsByOpp.get(r.opportunity_id);
      if (arr) arr.push(r);
      else roundsByOpp.set(r.opportunity_id, [r]);
    }
    const items = computeActionItems(opps, roundsByOpp);
    res.json({ items });
  });

  return router;
}
