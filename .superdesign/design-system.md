# JobPulse — Design System

## Product context

**What it is:** A local-only personal web app for tracking job interview progress. The user is the job seeker; they add opportunities when HR reaches out, record interview rounds as they happen, capture questions/feelings after each round, and track the pipeline from "HR reached out" to "offer accepted/rejected/withdrawn".

**Architecture:** Vite + React + TypeScript frontend, Express + SQLite backend, both running on the user's local machine. Data never leaves their computer. No auth (single user).

**Key flows:**
1. **Quick-add (most-used):** HR calls or sends message → user opens app → fills 5-6 fields (company, position, first interview time, location, contact, salary) → saves → back in 30 seconds.
2. **Interview prep:** User opens an opportunity detail page to review past rounds' questions and performance before the next round.
3. **Post-interview debrief:** User adds a round outcome (passed/failed) + notes about questions and their own performance.
4. **Pipeline review:** User opens the dashboard to see "what's coming up in the next 7 days" + "how many in progress / offered / rejected".
5. **Offer comparison:** When the user has multiple offers, they want to see side-by-side salary, work hours, benefits.

## Design direction: "Editor" — minimal + premium + a touch of color

**v1 problem:** First draft was pure neutral (near-black on white). The user said it felt empty, missing color, missing a logo, missing visual texture. So v2 introduces:
- A single restrained accent color (deep indigo, NOT bright blue)
- A subtle geometric background treatment (no flat white)
- A real custom LOGO

The goal: still serious / professional / calm (like Linear / Vercel / Notion), but with enough visual identity to feel like a real product, not a wireframe.

## Brand & visual identity

### LOGO

**Mark:** A 32×32 square with `rounded-lg` (8px), filled with `indigo-700` (#4338CA). Inside: a stylized "JP" monogram in white, semibold, 14px, tracking-tight. The "J" sits top-left, the "P" sits bottom-right, with the two letters slightly overlapping to suggest a pulse/joint.

**Wordmark:** "JobPulse" in 18px, semibold, tracking-tight, `text-neutral-900`. The "Pulse" suffix has a small **dot** at the end, in `indigo-700`, to echo the mark and add a "live signal" feel.

**Layout in sidebar:** 32×32 mark on the left, "JobPulse" wordmark on the right, both vertically centered. Total width ~140px. Optional subtitle in 11px, `text-neutral-500`, `tracking-wide uppercase` ("INTERVIEW TRACKER" or "求职追踪" — let the design pick one for the artistic feel).

### Color palette

**Surface:**
- `#FFFFFF` — pure white, primary card surface
- `#FAFAF9` — page background (very subtle warm off-white, NOT pure white)
- `#F4F4F5` — hover / nested surface (slightly cooler)
- `#0A0A0A` — near-black, primary text and high-emphasis accents
- `#18181B` — secondary text
- `#71717A` — tertiary text / metadata
- `#E4E4E7` — borders, dividers
- `#D4D4D8` — stronger borders (focus rings, hovered dividers)

**Accent — "Editor Indigo":**
- `#4338CA` (indigo-700) — primary accent: button bg, active nav, LOGO mark, links, focus rings
- `#6366F1` (indigo-500) — accent on hover, gradient endpoints
- `#A5B4FC` (indigo-300) — subtle accent (e.g., background gradient endpoint)
- `#EEF2FF` (indigo-50) — selected row background, soft accent surface

**Status colors (deliberately desaturated to match the calm aesthetic):**
- `#15803D` (green-700) — offered, passed
- `#0F766E` (teal-700) — accepted
- `#B91C1C` (red-700) — rejected, failed
- `#525252` (neutral-600) — withdrawn, cancelled
- `#1E40AF` (blue-800) — in progress, pending

### Background treatment (NEW for v2)

The page background is **NOT plain white.** A subtle multi-layer treatment:

1. **Base layer:** `#FAFAF9` (warm off-white) — the canvas
2. **Soft gradient mesh:** A large radial gradient blob from the top-right corner, fading from `#EEF2FF` (indigo-50) at 30% opacity to transparent. Width ~80% of the page. This adds atmospheric depth without being distracting.
3. **Geometric accent:** A subtle 1px grid of dots (12px spacing) at 4% opacity covering the entire page background. Visible only on close inspection, gives a "graph paper" feel.
4. **Optional accent shape:** A large ring (circle outline) in the top-right area, ~400px diameter, `indigo-200` at 20% opacity. Could be a 1px stroke or a soft fill. Provides a "branded" anchor.

**Layered stack (Tailwind):**
- `bg-stone-50` (the base, using `stone` instead of `neutral` for slightly warmer hue)
- then `bg-[radial-gradient(...)]` with indigo-50 endpoint
- then `bg-[url('data:image/svg+xml;...dot-pattern...')]` for the dot grid
- The main content sits on a `bg-white` card that visually pops above the textured background

### Typography

- **Sans:** System UI stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`)
- **Mono:** `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace`
- **Type scale:**
  - **Display (page title):** `text-2xl font-semibold tracking-tight text-neutral-900`
  - **Section heading:** `text-sm font-medium text-neutral-900`
  - **Body:** `text-sm text-neutral-700`
  - **Caption / label:** `text-xs font-medium text-neutral-500 tracking-wide uppercase`
  - **Numeric / KPI:** `text-4xl font-semibold tabular-nums tracking-tight text-neutral-900`
- **Line height:** `leading-relaxed` (1.625) body, `leading-tight` (1.25) display, `leading-snug` (1.375) headings
- **Letter spacing:** `tracking-tight` (-0.01em) on display, `tracking-wide` (0.04em) on uppercase labels

### Spacing

- Page padding: `px-10 py-8` main area, `px-5 py-7` sidebar
- Section gaps: `space-y-8` between major sections, `space-y-4` inside, `space-y-2` between list items
- Card padding: `p-5`
- Form field gaps: `space-y-3`
- Input padding: `px-3.5 py-2`

### Border radius

- Cards / modals: `rounded-xl` (12px)
- Buttons: `rounded-lg` (8px)
- Pills / status badges: `rounded-full`
- Inputs: `rounded-lg`

### Shadows

- Cards (default): `shadow-xs` (almost imperceptible)
- Cards (hover): `shadow-sm`
- Modals / popovers: `shadow-xl`
- Primary button (active): `shadow-sm shadow-indigo-700/30` (subtle indigo glow)

### Borders

- Default card / input border: `border border-neutral-200`
- Hovered border: `border-neutral-300`
- Focused border: `border-indigo-700 ring-2 ring-indigo-700/20 ring-offset-1`
- Dividers: `border-t border-neutral-100`

## Layout system

### Sidebar (240px)
- `w-60 bg-white border-r border-neutral-200 flex flex-col`
- Top: 32px padding, then the LOGO (mark + wordmark) — 32×32 mark on left, "JobPulse" on right. Below it: a 1px-tall divider `border-t border-neutral-100 mt-6 mb-4`.
- Nav items (with SVG icons, no emoji):
  - 仪表盘 (grid icon, lucide `LayoutGrid`)
  - 面试机会 (briefcase icon, lucide `Briefcase`)
  - Style: `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors`
  - Active: `bg-neutral-900 text-white` (or alternatively `bg-indigo-700 text-white` for a "tinted" active state — let the design pick)
  - Inactive hover: `bg-neutral-100 text-neutral-900`
- Bottom: a small "+ 新建面试" primary button (compact, fits in sidebar width). Sticky at bottom via `mt-auto`.
- Width: `w-60` (240px). Padding: `px-5 py-7`.

### Main content area
- `flex-1 px-10 py-8 overflow-y-auto`
- Page header: ~64px tall, contains page title (left) + primary action button (right). Has a subtle `border-b border-neutral-100` underneath to separate from content.
- Page title: `text-2xl font-semibold tracking-tight text-neutral-900`
- Optional breadcrumb above title: `text-xs text-neutral-500` ("面试机会 / 字节跳动 · 后端开发工程师")

### Cards (universal)
- `bg-white border border-neutral-200 rounded-xl p-5 shadow-xs`
- Hover: `hover:border-neutral-300 hover:shadow-sm transition`

### Status indicator (v2)
- Small leading **dot** (2×2 `rounded-full` bg-status-color) paired with the status text in `text-sm text-neutral-700`
- E.g. `● 进行中` instead of a filled pill
- More restrained than the current colorful pills

### Numeric tiles (Dashboard)
- `bg-white border border-neutral-200 rounded-xl p-6`
- Number: `text-4xl font-semibold tabular-nums tracking-tight text-neutral-900`
- Label: `text-xs text-neutral-500 tracking-wide uppercase mt-2`
- Maybe a small accent line on the left edge in indigo-700 (3px wide) for a subtle "this is a key metric" feel — only on the most important tile (e.g. "进行中")

### Buttons

- **Primary:** `bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-800 active:bg-indigo-900 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-700 focus:ring-offset-2`
- **Secondary:** `bg-white text-neutral-900 border border-neutral-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-50 active:bg-neutral-100 transition-colors`
- **Ghost:** `text-neutral-700 px-3 py-1.5 rounded-md text-sm hover:bg-neutral-100 transition-colors`
- **Danger:** `text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-md text-sm transition-colors`
- All transitions: `duration-150`

### Form fields

- Input: `w-full bg-white border border-neutral-300 rounded-lg px-3.5 py-2 text-sm placeholder-neutral-400 hover:border-neutral-400 focus:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700/20 transition`
- Label: `text-xs font-medium text-neutral-700 tracking-wide uppercase mb-1.5`
- Helper text: `text-xs text-neutral-500 mt-1.5`
- Multi-select (benefit tags): toggle pills. Selected: `bg-indigo-700 text-white border-indigo-700`. Unselected: `bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400`.

### Modal
- Backdrop: `bg-black/30 backdrop-blur-sm`
- Surface: `bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`
- Header: `border-b border-neutral-100 px-7 py-5`
- Body: `px-7 py-6`

## Iconography

- Inline SVG with `stroke="currentColor"`, `stroke-width="1.5"`, `fill="none"`, `viewBox="0 0 24 24"` (lucide-style, 24×24)
- Icon-only buttons get a tooltip
- No emoji anywhere in the UI

## Motion

- All transitions: 150ms ease-out for color/background, 200ms ease-out for transform
- No bouncing or spring physics
- Modal open: fade + scale-from-95% (200ms)

## What v2 fixes vs v1

| Issue | v1 | v2 |
|---|---|---|
| Background | Flat white | Warm off-white + gradient mesh + dot grid + decorative ring |
| Accent | Near-black only | Deep indigo `#4338CA` (primary), near-black for text |
| LOGO | Text-only "JobPulse" in blue | Custom "JP" mark + wordmark with accent dot |
| Status pills | Filled colored pills | Leading dot + neutral text |
| Cards | Border only, no shadow | `shadow-xs` default, `shadow-sm` on hover |
| Sidebar nav | Active = blue block | Active = near-black block (or indigo) |
| Primary button | Near-black | Indigo-700 |
