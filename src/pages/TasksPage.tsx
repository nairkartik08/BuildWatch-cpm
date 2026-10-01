import React from 'react';
import { ListFilter } from 'lucide-react';

export const TasksPage: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Tasks, Deliveries & Delay Events</h2>
          <p className="text-xs text-[#9aa6b8]">Manage task durations, contractors, deliveries, and inject schedule delays.</p>
        </div>
      </div>
      <div className="h-96 rounded-2xl border border-white/10 bg-[#121823]/60 flex flex-col items-center justify-center text-[#9aa6b8]">
        <ListFilter className="w-10 h-10 mb-2 text-[#35d07f] opacity-80" />
        <p className="text-sm font-semibold text-white">Task Management & Filter Table</p>
        <p className="text-xs mt-1">Ready for Phase 2 task listing and store connection.</p>
      </div>
    </div>
  );
};
