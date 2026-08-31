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
