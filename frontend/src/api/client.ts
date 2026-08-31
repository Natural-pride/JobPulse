import type { Opportunity, InterviewRound } from '../types';

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
};
