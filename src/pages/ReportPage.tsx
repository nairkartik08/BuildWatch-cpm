import React from 'react';
import { Share2 } from 'lucide-react';

export const ReportPage: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Executive Delay Risk Report</h2>
          <p className="text-xs text-[#9aa6b8]">Self-contained shareable report link compressed with lz-string.</p>
        </div>
      </div>
      <div className="h-96 rounded-2xl border border-white/10 bg-[#121823]/60 flex flex-col items-center justify-center text-[#9aa6b8]">
        <Share2 className="w-10 h-10 mb-2 text-[#ff4d4d] opacity-80" />
        <p className="text-sm font-semibold text-white">Executive Delay Report & Shareable Link</p>
        <p className="text-xs mt-1">Ready for Phase 11 compression and snapshot exporter.</p>
      </div>
    </div>
  );
};
