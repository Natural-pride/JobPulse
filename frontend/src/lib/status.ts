import type { OpportunityStatus, RoundType, RoundFormat, RoundOutcome } from '../types';

export const STATUS_META: Record<
  OpportunityStatus,
  { label: string; color: string; bgColor: string }
> = {
  in_progress: { label: '进行中', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  offered: { label: '已 Offer', color: 'text-green-700', bgColor: 'bg-green-100' },
  accepted: { label: '已接受', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  rejected: { label: '未通过', color: 'text-red-700', bgColor: 'bg-red-100' },
  withdrawn: { label: '我已撤回', color: 'text-slate-600', bgColor: 'bg-slate-100' },
};

export const ROUND_TYPE_META: Record<RoundType, string> = {
  hr_screen: 'HR 筛选',
  tech_1: '技术一面',
  tech_2: '技术二面',
  tech_3: '技术三面',
  comprehensive: '综合面',
  final: '终面',
  salary_negotiation: '谈薪',
  other: '其他',
};

export const FORMAT_META: Record<RoundFormat, string> = {
  online_video: '线上视频',
  onsite: '线下',
  phone: '电话',
};

export const OUTCOME_META: Record<
  RoundOutcome,
  { label: string; color: string; bgColor: string }
> = {
  pending: { label: '待面试', color: 'text-slate-600', bgColor: 'bg-slate-100' },
  passed: { label: '已通过', color: 'text-green-700', bgColor: 'bg-green-100' },
  failed: { label: '未通过', color: 'text-red-700', bgColor: 'bg-red-100' },
  cancelled: { label: '已取消', color: 'text-slate-500', bgColor: 'bg-slate-50' },
};
