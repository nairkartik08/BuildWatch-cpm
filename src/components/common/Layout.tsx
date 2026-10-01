import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  GitFork,
  CheckSquare,
  FileBarChart2,
  Menu,
  X,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';
import { GlobalSearchBar } from './GlobalSearchBar';
import { AlertsPanel } from '../Collab/AlertsPanel';

const navItems = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/schedule', label: 'Master Schedule', icon: CalendarDays },
  { to: '/app/graph', label: 'Network Diagram', icon: GitFork },
  { to: '/app/tasks', label: 'Task Management', icon: CheckSquare },
  { to: '/app/report', label: 'Project Report', icon: FileBarChart2 },
];

export const Layout: React.FC = () => {
  const location = useLocation();
  const [isNavOpen, setIsNavOpen] = React.useState(false);

  const pageTitle = navItems.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  )?.label ?? 'Project overview';

  return (
    <div className="app-shell flex h-screen w-full overflow-hidden">
      {isNavOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/45 lg:hidden"
          onClick={() => setIsNavOpen(false)}
        />
      )}
      <aside className={`app-sidebar fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col transition-transform lg:static lg:translate-x-0 ${isNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[72px] items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ffb020] text-sm font-black text-[#111827]">CP</span>
            <div>
              <div className="text-sm font-bold text-white">Critical Path</div>
              <div className="text-[11px] text-[#8e9ab0]">Project control room</div>
            </div>
          </div>
          <button type="button" onClick={() => setIsNavOpen(false)} className="app-icon-button lg:hidden" aria-label="Close navigation">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-3 mt-4 border border-white/10 bg-white/[0.035] p-3">
          <button type="button" className="flex w-full items-center justify-between text-left" aria-label="Current project">
            <div>
              <div className="text-xs font-semibold text-white">Hospital Wing A</div>
              <div className="mt-0.5 text-[11px] text-[#8e9ab0]">Foundation to envelope</div>
            </div>
            <ChevronDown className="h-4 w-4 text-[#8e9ab0]" />
          </button>
          <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3 text-[11px] text-[#b7c0cf]">
            <span className="h-2 w-2 rounded-full bg-[#35d07f]" />
            Tracking day 12
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#657084]">Workspace</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsNavOpen(false)}
                className={`app-nav-link flex items-center gap-3 px-3 py-2.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'is-active text-white'
                    : 'text-[#9aa6b8] hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-[#ffb020]' : 'text-[#9aa6b8]'}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <NavLink
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#9aa6b8] transition-colors hover:bg-white/[0.05] hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to landing page</span>
          </NavLink>
        </div>
      </aside>

      <main className="app-main flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="app-header flex h-[72px] shrink-0 items-center justify-between border-b border-white/10 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setIsNavOpen(true)} className="app-icon-button lg:hidden" aria-label="Open navigation">
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="text-[11px] text-[#8e9ab0]">Hospital Wing A</div>
              <h1 className="truncate text-sm font-semibold text-white">{pageTitle}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <GlobalSearchBar />
            <AlertsPanel />
            <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-xs">
              <span className="w-2 h-2 rounded-full bg-[#35d07f]" />
              <span className="text-[#8e9ab0]">Tracking:</span>
              <span className="font-bold text-white">Day 12 (Today)</span>
            </div>
          </div>
        </header>

        <div className="app-content flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
