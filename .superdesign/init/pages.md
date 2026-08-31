# JobPulse — Pages (dependency trees)

Traced dependencies for each page. Pass these as `--context-file` (under the PAYLOAD BUDGET rule in SUPERDESIGN.md) when generating redesign drafts.

## / (Dashboard)
Entry: `frontend/src/pages/Dashboard.tsx`
Dependencies:
- `frontend/src/components/StatCard.tsx`
- `frontend/src/lib/status.ts` (ROUND_TYPE_META, FORMAT_META)
- `frontend/src/lib/format.ts` (formatDateTime)
- `frontend/src/api/client.ts` (api.opportunities.list, api.rounds.list)
- `frontend/src/types.ts` (Opportunity, InterviewRound)
- `frontend/src/components/Layout.tsx` (parent route)
- (inherited via Layout) `react-router-dom` NavLink/Outlet
- (inherited) `frontend/src/index.css` (body styles)
- (inherited) `frontend/tailwind.config.js` (theme tokens)

## /opportunities (OpportunityList)
Entry: `frontend/src/pages/OpportunityList.tsx`
Dependencies:
- `frontend/src/components/OpportunityCard.tsx`
  - `frontend/src/lib/status.ts` (ROUND_TYPE_META)
  - `frontend/src/lib/format.ts` (formatDateTime)
  - `frontend/src/types.ts` (Opportunity, InterviewRound)
- `frontend/src/lib/status.ts` (STATUS_META)
- `frontend/src/api/client.ts`
- `frontend/src/types.ts`
- `frontend/src/components/Layout.tsx`

## /opportunities/new and /opportunities/:id/edit (OpportunityForm)
Entry: `frontend/src/pages/OpportunityForm.tsx`
Dependencies:
- `frontend/src/components/DateTimeInput.tsx`
  - `react-datepicker` + `react-datepicker/dist/react-datepicker.css`
  - `date-fns` + `date-fns/locale` (zhCN)
  - `frontend/src/lib/format.ts`
- `frontend/src/types.ts` (Opportunity, OpportunityStatus, RoundFormat)
- `frontend/src/api/client.ts` (api.opportunities.create / get / update + api.rounds.create)
- `frontend/src/components/Layout.tsx`
- (Inline `Field` helper at the bottom of the file)

## /opportunities/:id (OpportunityDetail)
Entry: `frontend/src/pages/OpportunityDetail.tsx`
Dependencies:
- `frontend/src/components/RoundCard.tsx`
  - `frontend/src/lib/status.ts` (ROUND_TYPE_META, FORMAT_META, OUTCOME_META)
  - `frontend/src/lib/format.ts` (formatDateTime)
  - `frontend/src/types.ts` (InterviewRound)
- `frontend/src/components/RoundModal.tsx`
  - `frontend/src/components/DateTimeInput.tsx`
  - `frontend/src/lib/status.ts` (ROUND_TYPE_META, FORMAT_META, OUTCOME_META)
  - `frontend/src/api/client.ts` (api.rounds.create / update / remove)
  - `frontend/src/types.ts`
- `frontend/src/lib/status.ts` (STATUS_META)
- `frontend/src/api/client.ts`
- `frontend/src/types.ts`
- `frontend/src/components/Layout.tsx`
- (Inline `OverviewCard` helper at the bottom)

## Note on shared globals
All pages inherit (via Layout or direct import chain):
- `frontend/src/index.css` (Tailwind base + body)
- `frontend/tailwind.config.js` (design tokens)
- `react-datepicker/dist/react-datepicker.css` (if any DateTimeInput is on the page)
