import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  GitFork,
  CheckSquare,
  FileBarChart2,
  Radio,
  ArrowLeft,
} from 'lucide-react';
import { GlobalSearchBar } from './GlobalSearchBar';

const navItems = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/schedule', label: 'Schedule (Gantt)', icon: CalendarDays },
  { to: '/app/graph', label: 'Dependency Graph', icon: GitFork },
  { to: '/app/tasks', label: 'Tasks & Delays', icon: CheckSquare },
  { to: '/app/report', label: 'Executive Report', icon: FileBarChart2 },
];

export const Layout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="flex h-screen w-full bg-[#0b0f16] text-[#e9edf3] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-[#0d121c]/95 flex flex-col shrink-0 z-20">
        {/* Brand */}
        <div className="h-16 px-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold tracking-tight text-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff4d4d] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#ff4d4d]"></span>
            </span>
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent font-black tracking-wide">
              CRITICAL PATH RADAR
            </span>
          </div>
        </div>

        {/* Project Selector / Status badge */}
        <div className="p-4 border-b border-white/5 bg-[#121823]/50">
          <div className="flex items-center justify-between text-xs text-[#9aa6b8] mb-1">
            <span>Hospital Wing B</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#ff4d4d]/20 text-[#ff4d4d] border border-[#ff4d4d]/30">
              LIVE RADAR
            </span>
          </div>
          <div className="text-xs font-medium text-slate-300">Phase 1: Foundation to Envelope</div>
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
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#ffb020]/20 to-[#ff4d4d]/20 text-[#ffb020] border border-[#ffb020]/40 shadow-sm shadow-[#ffb020]/10'
                    : 'text-[#9aa6b8] hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#ffb020]' : 'text-[#9aa6b8]'}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer / Landing switch */}
        <div className="p-3 border-t border-white/10 space-y-2">
          <NavLink
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#9aa6b8] hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to 3D Landing</span>
          </NavLink>
          <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-[#9aa6b8] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-[#35d07f] animate-pulse" />
              Engine Online
            </span>
            <span className="font-mono text-[10px] text-slate-400">v0.1</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0b0f16]">
        {/* Top Header */}
        <header className="h-16 px-6 border-b border-white/10 flex items-center justify-between bg-[#0d121c]/60 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold tracking-wide text-white capitalize">
              {location.pathname === '/app'
                ? 'Project Overview & Critical Delay Risks'
                : location.pathname.replace('/app/', '').replace('-', ' ') + ' View'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <GlobalSearchBar />
            <div className="flex items-center gap-2 bg-[#121823] border border-white/10 px-3 py-1.5 rounded-lg text-xs">
              <span className="w-2 h-2 rounded-full bg-[#35d07f]" />
              <span className="text-[#9aa6b8]">Day Offset:</span>
              <span className="font-bold text-white">Day 12 (Today)</span>
            </div>
          </div>
        </header>

        {/* View body */}
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
