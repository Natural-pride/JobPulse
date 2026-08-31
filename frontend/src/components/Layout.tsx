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
