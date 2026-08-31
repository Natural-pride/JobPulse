import { z } from 'zod';

export const opportunityCreateSchema = z.object({
  company_name: z.string().min(1),
  position_name: z.string().min(1),
  city: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  salary_range: z.string().nullable().optional(),
  benefits: z.string().nullable().optional(),
  has_weekends_off: z.boolean().optional(),
  work_hours: z.string().nullable().optional(),
  jd_text: z.string().nullable().optional(),
  jd_url: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  contact_info: z.string().nullable().optional(),
  status: z
    .enum(['in_progress', 'offered', 'accepted', 'rejected', 'withdrawn'])
    .optional(),
  final_salary: z.string().nullable().optional(),
  final_benefits: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const opportunityUpdateSchema = opportunityCreateSchema.partial();

export type OpportunityCreateInput = z.infer<typeof opportunityCreateSchema>;
export type OpportunityUpdateInput = z.infer<typeof opportunityUpdateSchema>;

export const roundCreateSchema = z.object({
  round_number: z.number().int().min(1),
  round_type: z.enum([
    'hr_screen',
    'tech_1',
    'tech_2',
    'tech_3',
    'comprehensive',
    'final',
    'salary_negotiation',
    'other',
  ]),
  format: z.enum(['online_video', 'onsite', 'phone']),
  location: z.string().nullable().optional(),
  scheduled_at: z.string().min(1),
  actual_at: z.string().nullable().optional(),
  duration_minutes: z.number().int().nullable().optional(),
  questions: z.string().nullable().optional(),
  my_performance: z.string().nullable().optional(),
  outcome: z.enum(['pending', 'passed', 'failed', 'cancelled']).optional(),
  next_round_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const roundUpdateSchema = roundCreateSchema.partial();

export type RoundCreateInput = z.infer<typeof roundCreateSchema>;
export type RoundUpdateInput = z.infer<typeof roundUpdateSchema>;
