import React, { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '../../store';
import { calculateCPM, generateScheduleAlerts } from '../../engine';
import { Bell, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const AlertsPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { tasks, delays, deliveries, project, setSelectedTaskId } = useProjectStore();

  const cpmResult = React.useMemo(() => {
    return calculateCPM({
      tasks,
      delays,
      deliveries,
      statusDay: project.statusDay,
      targetFinish: project.targetFinish,
    });
  }, [tasks, delays, deliveries, project.statusDay, project.targetFinish]);

  const alerts = React.useMemo(() => {
    return generateScheduleAlerts({
      tasks,
      delays,
      deliveries,
      cpmResult,
      targetFinish: project.targetFinish,
    });
  }, [tasks, delays, deliveries, cpmResult, project.targetFinish]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded bg-[#0f172a] border border-[#232f44] hover:border-slate-600 text-slate-400 hover:text-white transition-colors cursor-pointer"
        title="Schedule Alerts"
      >
        <Bell className="w-4 h-4" />
        {alerts.length > 0 && (
          <span
            className={`absolute -top-1 -right-1 px-1 min-w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white font-mono ${
              criticalCount > 0 ? 'bg-red-600' : 'bg-amber-600'
            }`}
          >
            {alerts.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-md bg-[#141c2b] border border-[#232f44] shadow-xl z-50 overflow-hidden flex flex-col">
          <div className="p-3 px-4 border-b border-[#232f44] flex items-center justify-between bg-[#0f172a]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white text-xs">Schedule Alerts</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                {alerts.length} active
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-2 max-h-80 overflow-y-auto space-y-1 divide-y divide-[#232f44]">
            {alerts.map((al) => {
              let Icon = Info;
              let iconColor = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
              if (al.severity === 'critical') {
                Icon = AlertTriangle;
                iconColor = 'text-red-400 bg-red-500/10 border-red-500/30';
              } else if (al.severity === 'warning') {
                Icon = AlertCircle;
                iconColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
              }

              return (
                <div
                  key={al.id}
                  onClick={() => {
                    if (al.taskId) setSelectedTaskId(al.taskId);
                  }}
                  className="p-2.5 rounded hover:bg-slate-800/60 cursor-pointer transition-colors flex items-start gap-3"
                >
                  <div className={`p-1.5 rounded border shrink-0 mt-0.5 ${iconColor}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-xs leading-snug">
                      {al.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {al.message}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
