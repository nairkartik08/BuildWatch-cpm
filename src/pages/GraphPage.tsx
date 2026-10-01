import React from 'react';
import { GitFork } from 'lucide-react';

export const GraphPage: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Dependency Network & Blast Radius</h2>
          <p className="text-xs text-[#9aa6b8]">React Flow DAG with Dagre auto-layout and delay ripple propagation.</p>
        </div>
      </div>
      <div className="h-96 rounded-2xl border border-white/10 bg-[#121823]/60 flex flex-col items-center justify-center text-[#9aa6b8]">
        <GitFork className="w-10 h-10 mb-2 text-[#4da3ff] opacity-80" />
        <p className="text-sm font-semibold text-white">Dependency Graph Canvas</p>
        <p className="text-xs mt-1">Ready for Phase 6 React Flow + Dagre integration.</p>
      </div>
    </div>
  );
};
