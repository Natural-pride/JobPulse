export type OpportunityStatus =
  | 'in_progress'
  | 'offered'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export type RoundType =
  | 'hr_screen'
  | 'tech_1'
  | 'tech_2'
  | 'tech_3'
  | 'comprehensive'
  | 'final'
  | 'salary_negotiation'
  | 'other';

export type RoundFormat = 'online_video' | 'onsite' | 'phone';

export type RoundOutcome = 'pending' | 'passed' | 'failed' | 'cancelled';

export interface Opportunity {
  id: number;
  company_name: string;
  position_name: string;
  city: string | null;
  address: string | null;
  salary_range: string | null;
  benefits: string | null;
  has_weekends_off: number;
  work_hours: string | null;
  jd_text: string | null;
  jd_url: string | null;
  source: string | null;
  contact_info: string | null;
  status: OpportunityStatus;
  final_salary: string | null;
  final_benefits: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InterviewRound {
  id: number;
  opportunity_id: number;
  round_number: number;
  round_type: RoundType;
  format: RoundFormat;
  location: string | null;
  scheduled_at: string;
  actual_at: string | null;
  duration_minutes: number | null;
  questions: string | null;
  my_performance: string | null;
  outcome: RoundOutcome;
  next_round_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
