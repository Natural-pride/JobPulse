import type { Opportunity, InterviewRound, OpportunityStatus } from '../types';

export type ActionType =
  | 'follow_up'
  | 'add_next_round'
  | 'fill_offer'
  | 'pending_overdue'
  | 'status_inconsistent';

export type ActionSeverity = 'red' | 'yellow' | 'blue';

export interface ActionItem {
  type: ActionType;
  severity: ActionSeverity;
  opportunity_id: number;
  company: string;
  position: string;
  message: string;
  hint: string;
  days_idle?: number;
}

export interface PagedOpportunities {
  items: Opportunity[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

const BASE = '/api';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  opportunities: {
    list: () => request<Opportunity[]>(`/opportunities`),
    listPaged: (params: {
      page?: number;
      pageSize?: number;
      status?: OpportunityStatus;
      search?: string;
      source?: string;
      has_rounds?: boolean;
      has_passed_round?: boolean;
    } = {}) => {
      const qs = new URLSearchParams();
      if (params.page !== undefined) qs.set('page', String(params.page));
      if (params.pageSize !== undefined) qs.set('pageSize', String(params.pageSize));
      if (params.status) qs.set('status', params.status);
      if (params.search) qs.set('search', params.search);
      if (params.source) qs.set('source', params.source);
      if (params.has_rounds) qs.set('has_rounds', 'true');
      if (params.has_passed_round) qs.set('has_passed_round', 'true');
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return request<PagedOpportunities>(`/opportunities${suffix}`);
    },
    /** Distinct source values used across all opportunities (sorted by frequency). */
    listSources: () => request<string[]>(`/opportunities/sources`),
    get: (id: number) => request<Opportunity>(`/opportunities/${id}`),
    create: (data: Partial<Opportunity>) =>
      request<Opportunity>(`/opportunities`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<Opportunity>) =>
      request<Opportunity>(`/opportunities/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    remove: (id: number) =>
      request<void>(`/opportunities/${id}`, { method: 'DELETE' }),
  },
  rounds: {
    list: (opportunityId: number) =>
      request<InterviewRound[]>(`/opportunities/${opportunityId}/rounds`),
    create: (opportunityId: number, data: Partial<InterviewRound>) =>
      request<InterviewRound>(`/opportunities/${opportunityId}/rounds`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<InterviewRound>) =>
      request<InterviewRound>(`/rounds/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    remove: (id: number) =>
      request<void>(`/rounds/${id}`, { method: 'DELETE' }),
  },
  actionItems: {
    list: () => request<{ items: ActionItem[] }>(`/action-items`),
  },
};
