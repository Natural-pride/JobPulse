# JobPulse — Routes

The app uses React Router v6 with `<BrowserRouter>` and a parent `<Route>` for the Layout wrapper. There are 5 routes total, all under the Layout.

## Route map

| URL path | Component file | Page purpose |
|---|---|---|
| `/` (index) | `frontend/src/pages/Dashboard.tsx` | Stats overview (4 cards) + upcoming interviews (7 days) |
| `/opportunities` | `frontend/src/pages/OpportunityList.tsx` | Card list with status filter + search |
| `/opportunities/new` | `frontend/src/pages/OpportunityForm.tsx` | Quick-add form (new mode: ~7 main fields + collapsible 高级选项; on save auto-creates Round #1 if first interview time set) |
| `/opportunities/:id` | `frontend/src/pages/OpportunityDetail.tsx` | Detail with 4 overview cards + JD + rounds timeline + status select |
| `/opportunities/:id/edit` | `frontend/src/pages/OpportunityForm.tsx` (same component, edit mode) | Full edit form |

## Router config (`frontend/src/App.tsx`)

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import OpportunityList from './pages/OpportunityList';
import OpportunityForm from './pages/OpportunityForm';
import OpportunityDetail from './pages/OpportunityDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="opportunities" element={<OpportunityList />} />
          <Route path="opportunities/new" element={<OpportunityForm />} />
          <Route path="opportunities/:id" element={<OpportunityDetail />} />
          <Route path="opportunities/:id/edit" element={<OpportunityForm />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

## Page summaries

### Dashboard (`/`)
Fetches all opportunities + their rounds in parallel. Renders 4 StatCards (in_progress, offered, rejected, total) and a list of "upcoming" rounds in the next 7 days. Includes a "+ 新建面试机会" button in the top right.

### OpportunityList (`/opportunities`)
Fetches all opportunities + rounds. Status filter (dropdown) + search box (filters by company/position name). Renders OpportunityCard list. Empty state: "还没有面试机会，点右上角"新建"开始。"

### OpportunityForm (`/opportunities/new` and `/opportunities/:id/edit`)
Single component, dual mode. New mode: 7 visible fields (company, position, first interview time + format, location, contact, source, salary) + 1 collapsible "高级选项" section. Edit mode: same form pre-filled. On save new: also creates Round #1 if first interview time was provided. On save edit: navigates back to detail.

### OpportunityDetail (`/opportunities/:id`)
Fetches opportunity + rounds. Renders 4 overview cards (salary/work_hours/benefits/weekends_off), JD section, and a rounds list (RoundCard per round). Top right: edit + delete buttons + status select. Shows "录入 offer 详情" call-to-action if status is offered/accepted and final_salary or final_benefits is missing.
