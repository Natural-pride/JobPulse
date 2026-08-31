import { NavLink, Outlet } from 'react-router-dom';
import Logo from './Logo';
import { ROUND_TYPE_META, FORMAT_META } from '../lib/status';

const navItem = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
    isActive
      ? 'bg-neutral-900 text-white'
      : 'text-neutral-700 hover:bg-neutral-100'
  }`;

const ICON = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  opportunities: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
};

export default function Layout() {
  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-white border-r border-neutral-200 px-5 py-7 flex flex-col gap-2 shrink-0">
        <div className="mb-6">
          <Logo size={32} />
        </div>
        <nav className="flex flex-col gap-1">
          <NavLink to="/" end className={navItem}>
            {ICON.dashboard}
            <span>仪表盘</span>
          </NavLink>
          <NavLink to="/opportunities" className={navItem}>
            {ICON.opportunities}
            <span>面试机会</span>
          </NavLink>
          <NavLink to="/calendar" className={navItem}>
            {ICON.calendar}
            <span>面试日历</span>
          </NavLink>
        </nav>
        <NavLink
          to="/opportunities/new"
          className="mt-auto flex items-center justify-center gap-2 bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-800 active:bg-indigo-900 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-700 focus:ring-offset-2"
        >
          {ICON.plus}
          <span>新建面试</span>
        </NavLink>
      </aside>
      <main className="flex-1 px-10 py-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

// Re-export metadata constants so other modules can use them when needed
export { ROUND_TYPE_META, FORMAT_META };
