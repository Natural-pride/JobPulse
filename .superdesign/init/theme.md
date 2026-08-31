# JobPulse — Theme

The project uses **Tailwind CSS v3** with a tiny custom color extension. There is no separate `theme.ts` or design tokens file. The whole "theme" is the Tailwind config + `index.css` body rule.

## Part 1 — Token summary

### Color palette

| Token | Value | Usage |
|---|---|---|
| `brand-50` | `#eef6ff` | Lightest blue (hover states) |
| `brand-500` | `#3b82f6` | Primary blue (Tailwind default) — buttons, links, active nav |
| `brand-600` | `#2563eb` | Primary hover |
| `brand-700` | `#1d4ed8` | (Defined but rarely used) |
| `slate-50` | (Tailwind default) | Body background |
| `slate-200` | (Tailwind default) | Card / input borders |
| `slate-300` | (Tailwind default) | Input borders |
| `slate-500` | (Tailwind default) | Secondary text |
| `slate-700` | (Tailwind default) | Body text on hover |
| `slate-900` | (Tailwind default) | Primary body text |
| `green-100` / `green-700` | (Tailwind default) | "Offered" / "Passed" / success states |
| `red-100` / `red-700` | (Tailwind default) | "Rejected" / "Failed" / delete states |
| `blue-100` / `blue-700` | (Tailwind default) | "In progress" / pending states |
| `emerald-100` / `emerald-700` | (Tailwind default) | "Accepted" (distinguished from "Offered") |

### Type scale
Uses Tailwind defaults — `text-xs` through `text-3xl` (no custom font sizes). No custom font family; uses system stack.

### Spacing scale
Tailwind defaults (`p-1.5` through `p-8` used). Form section spacing: `space-y-3` / `space-y-4`. Card padding: `p-3` (compact overview) or `p-4` (regular card). Generous page padding: `p-8` on the main area.

### Border radius
Tailwind defaults: `rounded` (4px), `rounded-lg` (8px). Buttons: `rounded`. Cards: `rounded-lg`. Pills: `rounded`.

### Shadows
Currently NONE. No `shadow-*` classes are used. Cards are differentiated only by border + background color.

### Other patterns
- Hover transitions: `transition` (default 150ms ease-in-out)
- Input border on focus: `focus:border-brand-500 focus:outline-none`
- All inputs: `border border-slate-300 rounded px-3 py-1.5`

## Part 2 — Raw source

### `frontend/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
};
```

### `frontend/src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-slate-50 text-slate-900;
}
```

## Notes for redesign

The current palette is **Tailwind blue 500** (a bright, friendly blue). The user wants "简约又体现高级感" (minimalist + premium). Consider:

- **Direction A — Mono / Neutral:** Switch to a near-black-and-white palette with a single subtle accent (e.g., a deep slate-900 + a single emerald or amber for "offered"/"passed" states). Feels like Linear / Vercel / Notion.
- **Direction B — Premium dark + bright accent:** A primarily white surface with a sophisticated accent color (deep indigo, deep emerald, or a refined terracotta) for primary actions. Feels like Stripe / Arc.
- **Direction C — Editorial / Serif accents:** Keep blue but add serif font for headings + heavier type hierarchy. Feels like Substack / Are.na.

The user mentioned "高级感" twice, so Direction A or B is more likely. No `:root` CSS variables exist — all design tokens are Tailwind utilities, which means a palette change is just a `tailwind.config.js` rewrite + class renames.
