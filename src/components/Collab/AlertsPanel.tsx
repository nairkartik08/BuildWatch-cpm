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
        className="relative p-2 rounded-xl bg-[#121823] border border-white/10 hover:border-white/20 text-[#8e9ab0] hover:text-white transition-colors"
        title="Schedule Alerts"
      >
        <Bell className="w-4 h-4" />
        {alerts.length > 0 && (
          <span
            className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-black font-mono ${
              criticalCount > 0 ? 'bg-[#ff4d4d]' : 'bg-[#ffb020]'
            }`}
          >
            {alerts.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#121926] border border-white/15 shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150 flex flex-col">
          <div className="p-3.5 px-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#ffb020]" />
              <span className="font-bold text-white text-xs">Live Schedule Alerts</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-white/10 text-slate-300 font-mono">
                {alerts.length} active
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-[#8e9ab0] hover:text-white rounded-lg hover:bg-white/5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-2 max-h-80 overflow-y-auto space-y-1.5 divide-y divide-white/5">
            {alerts.map((al) => {
              let Icon = Info;
              let iconColor = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
              if (al.severity === 'critical') {
                Icon = AlertTriangle;
                iconColor = 'text-[#ff4d4d] bg-red-500/10 border-red-500/30';
              } else if (al.severity === 'warning') {
                Icon = AlertCircle;
                iconColor = 'text-[#ffb020] bg-amber-500/10 border-amber-500/30';
              }

              return (
                <div
                  key={al.id}
                  onClick={() => {
                    if (al.taskId) setSelectedTaskId(al.taskId);
                  }}
                  className="p-3 rounded-xl hover:bg-white/[0.04] cursor-pointer transition-colors flex items-start gap-3"
                >
                  <div className={`p-1.5 rounded-lg border shrink-0 mt-0.5 ${iconColor}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-xs leading-snug">
                      {al.title}
                    </div>
                    <div className="text-[11px] text-[#8e9ab0] mt-0.5 leading-relaxed">
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
