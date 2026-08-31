# JobPulse — Components

All reusable UI primitives live in `frontend/src/components/`. The project has NO third-party component library — every component is hand-rolled with Tailwind classes.

## StatusBadge
- **File:** `frontend/src/components/StatusBadge.tsx`
- **Purpose:** Small colored pill showing one of 5 opportunity statuses.
- **Props:** `status: OpportunityStatus`
- **Source:**

```tsx
import { STATUS_META } from '../lib/status';
import type { OpportunityStatus } from '../types';

export default function StatusBadge({ status }: { status: OpportunityStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${meta.color} ${meta.bgColor}`}>
      {meta.label}
    </span>
  );
}
```

## StatCard
- **File:** `frontend/src/components/StatCard.tsx`
- **Purpose:** Big number with label (dashboard tiles).
- **Props:** `label: string`, `value: number`, `color?: string` (default `text-slate-900`)
- **Source:**

```tsx
export default function StatCard({
  label,
  value,
  color = 'text-slate-900',
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-slate-500 mt-1">{label}</div>
    </div>
  );
}
```

## OpportunityCard
- **File:** `frontend/src/components/OpportunityCard.tsx`
- **Purpose:** Card linking to opportunity detail. Shows company, position, salary, city, work hours, weekends-off, status, next pending round.
- **Props:** `opportunity: Opportunity`, `rounds: InterviewRound[]`
- **Source:** see file (uses inline status label map; could be refactored to use StatusBadge)

## CollapsibleSection
- **File:** `frontend/src/components/CollapsibleSection.tsx`
- **Purpose:** Generic collapsible group with title bar.
- **Props:** `title: string`, `defaultOpen?: boolean`, `children`
- **Source:**

```tsx
import { useState } from 'react';

export default function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded mb-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2.5 text-left font-medium flex items-center justify-between hover:bg-slate-50"
      >
        <span>{title}</span>
        <span className="text-slate-400">{open ? '▼' : '▶'}</span>
      </button>
      {open && <div className="px-4 py-3 border-t border-slate-200 space-y-3">{children}</div>}
    </div>
  );
}
```

## RoundCard
- **File:** `frontend/src/components/RoundCard.tsx`
- **Purpose:** Display one interview round with edit/delete actions.
- **Props:** `round: InterviewRound`, `onEdit: () => void`, `onDelete: () => void`
- **Source:** see file (uses ROUND_TYPE_META / FORMAT_META / OUTCOME_META / formatDateTime)

## RoundModal
- **File:** `frontend/src/components/RoundModal.tsx`
- **Purpose:** Controlled modal for adding/editing a round. Has two halves: pre-interview (type/format/time/location) and post-interview (actual time/questions/perf/outcome).
- **Props:** `open`, `onClose`, `onSaved`, `opportunityId`, `initial: InterviewRound | null`, `defaultRoundNumber?: number`
- **Source:** see file (largest component — ~300 lines including 3 DateTimeInput + 4 select dropdowns)

## DateTimeInput
- **File:** `frontend/src/components/DateTimeInput.tsx`
- **Purpose:** Date+time picker built on react-datepicker with Chinese locale, 10-minute intervals. Replaces native datetime-local.
- **Props:** `value: string` (ISO), `onChange: (v: string) => void`, `required?: boolean`
- **Source:**

```tsx
import DatePicker from 'react-datepicker';
import { zhCN } from 'date-fns/locale';
import { format, parseISO, isValid } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';

export default function DateTimeInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const parsed: Date | null = value && isValid(parseISO(value)) ? parseISO(value) : null;

  function handleChange(d: Date | null) {
    if (!d) {
      onChange('');
      return;
    }
    onChange(format(d, "yyyy-MM-dd'T'HH:mm:ss"));
  }

  return (
    <DatePicker
      selected={parsed}
      onChange={handleChange}
      showTimeSelect
      timeIntervals={10}
      timeCaption="时间"
      dateFormat="yyyy-MM-dd HH:mm"
      locale={zhCN}
      placeholderText="点击选择日期时间"
      isClearable
      className="w-full border border-slate-300 rounded px-3 py-1.5 focus:border-brand-500 focus:outline-none"
      wrapperClassName="w-full"
    />
  );
}
```
