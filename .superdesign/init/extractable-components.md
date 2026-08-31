# JobPulse — Extractable Components

Components that could be extracted as reusable Superdesign `DraftComponent` entities for cross-page design reuse.

## Layout Components

### AppShell (Layout)
- **Source:** `frontend/src/components/Layout.tsx`
- **Category:** layout
- **Description:** App shell with sidebar nav (2 items: 仪表盘, 面试机会) and main content area.
- **Extractable props:**
  - `activeItem: 'dashboard' | 'opportunities'` (currently driven by NavLink's isActive automatically; explicit prop would allow non-router contexts)
  - `userName?: string` (currently no user concept; could be added for future multi-user)
- **Hardcoded:** JobPulse title, 2 nav items (仪表盘/面试机会), emoji icons, "w-56" sidebar width, "p-8" main padding
- **Notes:** Currently a 2-item nav. A redesign might want a more sophisticated nav (e.g., add a "+" shortcut, or show counts on items).

## Basic Components

### StatCard
- **Source:** `frontend/src/components/StatCard.tsx`
- **Category:** basic
- **Description:** Big number with small label, used for dashboard tiles.
- **Extractable props:** `label: string`, `value: number`, `color?: string` (default slate-900)
- **Hardcoded:** `bg-white rounded-lg border border-slate-200 p-4` card surface, `text-3xl font-bold` number, `text-sm text-slate-500` label
- **Notes:** Currently a passive display. Could be enhanced with a delta/trend indicator or icon.

### StatusBadge
- **Source:** `frontend/src/components/StatusBadge.tsx`
- **Category:** basic
- **Description:** Small pill for one of 5 opportunity statuses.
- **Extractable props:** `status: OpportunityStatus`
- **Hardcoded:** `px-2 py-0.5 rounded text-xs font-medium` pill style; the actual color/label comes from `STATUS_META` lookup
- **Notes:** A redesign might want different visual treatments per status (e.g., a leading dot, an icon, varying opacities for "draft" vs "final" states).

### OpportunityCard
- **Source:** `frontend/src/components/OpportunityCard.tsx`
- **Category:** basic
- **Description:** Card link to an opportunity's detail page. Shows company+position, salary+city+work_hours+weekends-off, status, next pending round.
- **Extractable props:** `opportunity: Opportunity`, `rounds: InterviewRound[]`
- **Hardcoded:** Inline status label map (could be replaced by StatusBadge), `bg-white rounded-lg border border-slate-200 p-4 hover:border-brand-500 hover:shadow-sm transition` card surface
- **Notes:** The inline status pill is inconsistent with the StatusBadge component — a redesign should use StatusBadge here.

### CollapsibleSection
- **Source:** `frontend/src/components/CollapsibleSection.tsx`
- **Category:** basic
- **Description:** Generic collapsible with title bar.
- **Extractable props:** `title: string`, `defaultOpen?: boolean`, `children`
- **Hardcoded:** `border border-slate-200 rounded`, `hover:bg-slate-50`, `▼/▶` chevrons (use of unicode)
- **Notes:** A redesign might use a more elegant chevron (svg icon) and smoother open/close animation.

### DateTimeInput
- **Source:** `frontend/src/components/DateTimeInput.tsx`
- **Category:** basic
- **Description:** Date+time picker (10-min intervals) using react-datepicker. Used in 4 places.
- **Extractable props:** `value: string`, `onChange: (v: string) => void`, `required?: boolean`
- **Hardcoded:** zhCN locale, 10-min interval, "yyyy-MM-dd HH:mm" format, "点击选择日期时间" placeholder, isClearable
- **Notes:** Pulls in react-datepicker's default CSS. A redesign might restyle the picker or use a different library.

## Composite / Domain Components

### RoundCard
- **Source:** `frontend/src/components/RoundCard.tsx`
- **Category:** basic
- **Description:** Card showing one interview round with edit/delete buttons.
- **Extractable props:** `round: InterviewRound`, `onEdit: () => void`, `onDelete: () => void`
- **Hardcoded:** `bg-white border border-slate-200 rounded-lg p-4` card surface
- **Notes:** Used in OpportunityDetail timeline.

### RoundModal
- **Source:** `frontend/src/components/RoundModal.tsx`
- **Category:** basic
- **Description:** Modal for adding/editing a round. ~300 lines. Has two halves: pre-interview fields and post-interview fields.
- **Extractable props:** `open: boolean`, `onClose: () => void`, `onSaved: () => void`, `opportunityId: number`, `initial: InterviewRound | null`, `defaultRoundNumber?: number`
- **Hardcoded:** `fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4` modal backdrop, `bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto` modal surface
- **Notes:** Largest component. A redesign could split this into 2 steps (invite info → post-interview notes) or move some fields to inline display.

## Components that are NOT extractable (page-specific)

- `OverviewCard` (inline at bottom of `OpportunityDetail.tsx`) — page-specific.
- `Field` (inline at bottom of `OpportunityForm.tsx`) — page-specific.
