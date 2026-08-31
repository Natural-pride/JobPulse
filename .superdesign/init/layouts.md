# JobPulse — Layouts

The app has ONE shared layout component. It is used as the parent route for all pages.

## Layout
- **File:** `frontend/src/components/Layout.tsx`
- **Used by:** All pages (mounted as parent route in `App.tsx`)
- **Structure:** `min-h-screen flex` with a 56-wide sidebar (nav) and a flex-1 main area. Sidebar has JobPulse title + 2 NavLinks.
- **Source:**

```tsx
import { NavLink, Outlet } from 'react-router-dom';

const navItem = ({ isActive }: { isActive: boolean }) =>
  `block px-4 py-2 rounded transition ${
    isActive
      ? 'bg-brand-500 text-white'
      : 'text-slate-700 hover:bg-slate-200'
  }`;

export default function Layout() {
  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-white border-r border-slate-200 p-4 flex flex-col gap-2">
        <h1 className="text-xl font-bold text-brand-600 mb-4">JobPulse</h1>
        <nav className="flex flex-col gap-1">
          <NavLink to="/" end className={navItem}>
            📊 仪表盘
          </NavLink>
          <NavLink to="/opportunities" className={navItem}>
            📋 面试机会
          </NavLink>
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

**Notes for redesign:**
- Sidebar uses emoji + plain text. No icon library.
- The "active" state is `bg-brand-500 text-white` (solid blue block). No underline / left-border accent.
- Sidebar has only 2 nav items — could expand later but currently minimal.
- `flex-1` main area with `p-8 overflow-y-auto` (very generous padding).
