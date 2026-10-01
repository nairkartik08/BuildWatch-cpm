import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  GitFork,
  CheckSquare,
  FileBarChart2,
  HardHat,
  ArrowLeft,
  Activity,
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

  return (
    <div className="flex h-screen w-full bg-[#0c1017] text-[#f1f5f9] overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#232f44] bg-[#141c2b] flex flex-col shrink-0 z-20">
        {/* Brand */}
        <div className="h-16 px-5 border-b border-[#232f44] flex items-center justify-between bg-[#0f172a]">
          <div className="flex items-center gap-2.5 font-bold tracking-tight text-sm text-white">
            <span className="p-1.5 rounded bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <HardHat className="w-4 h-4" />
            </span>
            <div className="flex flex-col">
              <span className="font-bold tracking-wide text-white leading-tight">BUILDWATCH CPM</span>
              <span className="text-[10px] text-slate-400 font-normal">Construction Project Manager</span>
            </div>
          </div>
        </div>

        {/* Project Selector / Status badge */}
        <div className="p-4 border-b border-[#232f44] bg-[#0f172a]/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-slate-200">Hospital Wing B</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              ACTIVE PROJECT
            </span>
          </div>
          <div className="text-xs text-slate-400">Phase 1: Foundation to Envelope</div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer / Landing switch */}
        <div className="p-3 border-t border-[#232f44] space-y-2 bg-[#0f172a]">
          <NavLink
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Project Landing View</span>
          </NavLink>
          <div className="px-3 py-2 rounded bg-slate-900 border border-[#232f44] text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              CPM Engine Active
            </span>
            <span className="font-mono text-[10px] text-slate-400">v1.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0c1017]">
        {/* Top Header */}
        <header className="h-16 px-6 border-b border-[#232f44] flex items-center justify-between bg-[#141c2b] shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold tracking-tight text-white capitalize">
              {location.pathname === '/app'
                ? 'Project Schedule & Critical Path Overview'
                : location.pathname.replace('/app/', '').replace('-', ' ') + ' View'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <GlobalSearchBar />
            <AlertsPanel />
            <div className="flex items-center gap-2 bg-[#0f172a] border border-[#232f44] px-3 py-1.5 rounded text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-400">Status Date:</span>
              <span className="font-bold text-white">Day 12 (Today)</span>
            </div>
          </div>
        </header>

        {/* View body */}
        <div className="flex-1 overflow-auto p-6 bg-[#0c1017]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
