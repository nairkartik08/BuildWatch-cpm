import React from 'react';
import { AlertTriangle, TrendingDown, Clock, ShieldCheck } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Project Radar Dashboard</h2>
          <p className="text-xs text-[#9aa6b8]">Live critical path status, delay radar & recovery action recommendations.</p>
        </div>
      </div>

      {/* KPI Cards Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#121823]/80 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-[#9aa6b8] mb-2">
            <span>Schedule Variance</span>
            <TrendingDown className="w-4 h-4 text-[#ff4d4d]" />
          </div>
          <div className="text-3xl font-extrabold text-[#ff4d4d]">+6 Days</div>
          <p className="text-[11px] text-[#9aa6b8] mt-1">Late vs target deadline</p>
        </div>

        <div className="bg-[#121823]/80 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-[#9aa6b8] mb-2">
            <span>On-Time Confidence</span>
            <Clock className="w-4 h-4 text-[#ffb020]" />
          </div>
          <div className="text-3xl font-extrabold text-[#ffb020]">41%</div>
          <p className="text-[11px] text-[#9aa6b8] mt-1">1,000 Monte Carlo iterations</p>
        </div>

        <div className="bg-[#121823]/80 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-[#9aa6b8] mb-2">
            <span>Critical Path Tasks</span>
            <AlertTriangle className="w-4 h-4 text-[#ff4d4d]" />
          </div>
          <div className="text-3xl font-extrabold text-white">9 Tasks</div>
          <p className="text-[11px] text-[#ff4d4d] mt-1">Zero float buffer remaining</p>
        </div>

        <div className="bg-[#121823]/80 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-[#9aa6b8] mb-2">
            <span>Recovery Plan</span>
            <ShieldCheck className="w-4 h-4 text-[#35d07f]" />
          </div>
          <div className="text-3xl font-extrabold text-[#35d07f]">Available</div>
          <p className="text-[11px] text-[#9aa6b8] mt-1">Expedite steel saves 4 days</p>
        </div>
      </div>

      <div className="bg-[#121823]/60 border border-white/10 rounded-2xl p-8 text-center text-[#9aa6b8]">
        <div className="inline-flex p-3 rounded-full bg-white/5 mb-3">
          <Clock className="w-6 h-6 text-[#ffb020]" />
        </div>
        <h3 className="text-white font-semibold mb-1">Phase 1 Scaffold Active</h3>
        <p className="text-xs max-w-md mx-auto">
          Full live CPM calculations, Monte Carlo simulations, Gantt radar, and interactive risk engines will be plugged in sequentially.
        </p>
      </div>
    </div>
  );
};
