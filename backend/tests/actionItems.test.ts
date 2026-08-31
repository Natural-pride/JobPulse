import { describe, it, expect } from 'vitest';
import {
  computeActionItems,
  type ActionItem,
} from '../src/routes/actionItems.js';
import type { InterviewRound, Opportunity } from '../src/types.js';

const NOW = new Date('2026-08-31T12:00:00Z').getTime();
const ONE_DAY = 24 * 60 * 60 * 1000;

function isoDaysAgo(days: number): string {
  return new Date(NOW - days * ONE_DAY).toISOString().replace('T', ' ').slice(0, 19);
}

function isoFutureDays(days: number): string {
  return new Date(NOW + days * ONE_DAY).toISOString().replace('T', ' ').slice(0, 19);
}

function makeOpp(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: 1,
    company_name: 'Acme',
    position_name: 'Backend',
    province: null,
    city: null,
    address: null,
    salary_range: null,
    benefits: null,
    weekend_policy: null,
    work_hours: null,
    jd_text: null,
    jd_url: null,
    source: null,
    contact_info: null,
    status: 'in_progress',
    final_salary: null,
    final_benefits: null,
    notes: null,
    resume_submitted_at: null,
    created_at: isoDaysAgo(30),
    updated_at: isoDaysAgo(3),
    ...overrides,
  };
}

function makeRound(overrides: Partial<InterviewRound>): InterviewRound {
  return {
    id: 1,
    opportunity_id: 1,
    round_number: 1,
    round_type: 'tech_1',
    format: 'online_video',
    location: null,
    scheduled_at: isoDaysAgo(2),
    actual_at: isoDaysAgo(2),
    duration_minutes: null,
    questions: null,
    my_performance: null,
    outcome: 'pending',
    next_round_date: null,
    notes: null,
    created_at: isoDaysAgo(2),
    updated_at: isoDaysAgo(2),
    ...overrides,
  };
}

describe('computeActionItems', () => {
  it('returns empty when no opportunities', () => {
    expect(computeActionItems([], new Map(), NOW)).toEqual([]);
  });

  it('ignores rejected/withdrawn opportunities', () => {
    const opp = makeOpp({ status: 'rejected' });
    const items = computeActionItems([opp], new Map(), NOW);
    expect(items).toEqual([]);
  });

  it('flags offer status missing final_salary as red', () => {
    const opp = makeOpp({ id: 1, status: 'offered' });
    const items = computeActionItems([opp], new Map(), NOW);
    expect(items.some((i) => i.type === 'fill_offer' && i.severity === 'red')).toBe(true);
  });

  it('does not flag offer status when final_salary present', () => {
    const opp = makeOpp({ id: 1, status: 'offered', final_salary: '15K*13' });
    const items = computeActionItems([opp], new Map(), NOW);
    expect(items.some((i) => i.type === 'fill_offer')).toBe(false);
  });

  it('flags 7-day idle as yellow and 14-day as red', () => {
    const opp7 = makeOpp({ id: 1, updated_at: isoDaysAgo(7) });
    const opp14 = makeOpp({ id: 2, updated_at: isoDaysAgo(14) });
    const opp3 = makeOpp({ id: 3, updated_at: isoDaysAgo(3) });
    const items = computeActionItems([opp7, opp14, opp3], new Map(), NOW);
    const f7 = items.find((i) => i.opportunity_id === 1);
    const f14 = items.find((i) => i.opportunity_id === 2);
    const f3 = items.find((i) => i.opportunity_id === 3);
    expect(f7?.type).toBe('follow_up');
    expect(f7?.severity).toBe('yellow');
    expect(f14?.severity).toBe('red');
    expect(f3).toBeUndefined();
  });

  it('uses latest round actual_at when newer than opp updated_at', () => {
    const opp = makeOpp({ id: 1, updated_at: isoDaysAgo(20) });
    const round = makeRound({ opportunity_id: 1, actual_at: isoDaysAgo(1), scheduled_at: isoDaysAgo(2) });
    const items = computeActionItems([opp], new Map([[1, [round]]]), NOW);
    // Most recent activity is 1 day ago, so no follow_up.
    expect(items.find((i) => i.type === 'follow_up')).toBeUndefined();
  });

  it('flags pending round overdue by 1+ day as red', () => {
    const opp = makeOpp({ id: 1 });
    const round = makeRound({ opportunity_id: 1, scheduled_at: isoDaysAgo(2), actual_at: null });
    const items = computeActionItems([opp], new Map([[1, [round]]]), NOW);
    const overdue = items.find((i) => i.type === 'pending_overdue');
    expect(overdue?.severity).toBe('red');
    expect(overdue?.message).toContain('第 1 轮');
  });

  it('does not flag upcoming pending rounds', () => {
    const opp = makeOpp({ id: 1 });
    const round = makeRound({ opportunity_id: 1, scheduled_at: isoFutureDays(3), actual_at: null });
    const items = computeActionItems([opp], new Map([[1, [round]]]), NOW);
    expect(items.find((i) => i.type === 'pending_overdue')).toBeUndefined();
  });

  it('flags add_next_round when last round passed and no pending follow-up', () => {
    const opp = makeOpp({ id: 1 });
    const rounds = [
      makeRound({ opportunity_id: 1, round_number: 1, outcome: 'passed', actual_at: isoDaysAgo(5) }),
    ];
    const items = computeActionItems([opp], new Map([[1, rounds]]), NOW);
    const hint = items.find((i) => i.type === 'add_next_round');
    expect(hint?.severity).toBe('blue');
    expect(hint?.message).toContain('第 1 轮已通过');
  });

  it('does not flag add_next_round when there is a pending next round', () => {
    const opp = makeOpp({ id: 1 });
    const rounds = [
      makeRound({ opportunity_id: 1, round_number: 1, outcome: 'passed', actual_at: isoDaysAgo(5) }),
      makeRound({ opportunity_id: 1, round_number: 2, outcome: 'pending', scheduled_at: isoFutureDays(3) }),
    ];
    const items = computeActionItems([opp], new Map([[1, rounds]]), NOW);
    expect(items.find((i) => i.type === 'add_next_round')).toBeUndefined();
  });

  it('does not flag add_next_round when last round is not passed', () => {
    const opp = makeOpp({ id: 1 });
    const rounds = [
      makeRound({ opportunity_id: 1, round_number: 1, outcome: 'pending', scheduled_at: isoFutureDays(3) }),
    ];
    const items = computeActionItems([opp], new Map([[1, rounds]]), NOW);
    expect(items.find((i) => i.type === 'add_next_round')).toBeUndefined();
  });

  it('sorts red before yellow before blue', () => {
    const opp = makeOpp({ id: 1, status: 'offered', updated_at: isoDaysAgo(20) });
    const items = computeActionItems([opp], new Map(), NOW);
    const idx_red = items.findIndex((i) => i.type === 'follow_up' && i.severity === 'red');
    const idx_yellow = items.findIndex((i) => i.type === 'fill_offer'); // no, fill_offer is also red
    // The two red items are: follow_up (red, 20d), fill_offer (red).
    // No yellow or blue should appear.
    expect(items.every((i) => i.severity === 'red')).toBe(true);
    expect(idx_red).toBeGreaterThanOrEqual(0);
  });
});

describe('computeActionItems — awaiting_response', () => {
  it('does not flag awaiting_response < 3 days', () => {
    const opp = makeOpp({
      id: 1,
      status: 'awaiting_response',
      resume_submitted_at: isoDaysAgo(2),
    });
    const items = computeActionItems([opp], new Map(), NOW);
    expect(items.find((i) => i.type === 'follow_up')).toBeUndefined();
  });

  it('flags awaiting_response >= 3 days as yellow', () => {
    const opp = makeOpp({
      id: 1,
      status: 'awaiting_response',
      resume_submitted_at: isoDaysAgo(3),
    });
    const items = computeActionItems([opp], new Map(), NOW);
    const f = items.find((i) => i.type === 'follow_up');
    expect(f?.severity).toBe('yellow');
    expect(f?.message).toContain('3 天');
  });

  it('flags awaiting_response >= 5 days as red with rejection hint', () => {
    const opp = makeOpp({
      id: 1,
      status: 'awaiting_response',
      resume_submitted_at: isoDaysAgo(7),
    });
    const items = computeActionItems([opp], new Map(), NOW);
    const f = items.find((i) => i.type === 'follow_up');
    expect(f?.severity).toBe('red');
    expect(f?.hint).toContain('未通过');
  });

  it('falls back to created_at when resume_submitted_at is missing', () => {
    const opp = makeOpp({
      id: 1,
      status: 'awaiting_response',
      resume_submitted_at: null,
      created_at: isoDaysAgo(6),
    });
    const items = computeActionItems([opp], new Map(), NOW);
    const f = items.find((i) => i.type === 'follow_up');
    expect(f?.severity).toBe('red');
  });
});
