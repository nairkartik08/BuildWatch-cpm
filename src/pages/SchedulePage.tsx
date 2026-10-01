import React, { useMemo } from 'react';
import { useProjectStore } from '../store';
import { calculateCPM } from '../engine';
import { GanttChart } from '../components/Gantt/GanttChart';
import { TrendingDown, CheckCircle2, Zap, RotateCcw } from 'lucide-react';

export const SchedulePage: React.FC = () => {
  const {
    tasks,
    delays,
    deliveries,
    contractors,
    project,
    selectedTaskId,
    setSelectedTaskId,
    injectSteelDelayDemo,
    resetDemo,
  } = useProjectStore();

  const cpmResult = useMemo(() => {
    return calculateCPM({
      tasks,
      delays,
      deliveries,
      statusDay: project.statusDay,
      targetFinish: project.targetFinish,
    });
  }, [tasks, delays, deliveries, project.statusDay, project.targetFinish]);

  const variance = cpmResult.scheduleVariance;
  const isOver = variance > 0;
  const criticalCount = cpmResult.criticalPath.length;
  const hasSteelDelay = delays.some((d) => d.taskId === 'task-del-steel');

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] space-y-4">
      {/* Top Banner KPI Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0 bg-[#121926]/80 border border-white/10 p-3.5 px-5 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            Schedule Radar Gantt
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
              Live CPM Active
            </span>
          </h2>
          <p className="text-xs text-[#8e9ab0]">
            Zero-float critical path in red · Slack buffer in green · Deliveries in cyan
          </p>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[#8e9ab0]">Projected:</span>
            <span className="font-bold text-white font-mono">Day {cpmResult.projectFinish}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#8e9ab0]">Target:</span>
            <span className="font-bold text-white font-mono">Day {project.targetFinish}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#8e9ab0]">Variance:</span>
            {isOver ? (
              <span className="text-[#ff4d4d] font-bold font-mono flex items-center gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" />+{variance}d
              </span>
            ) : (
              <span className="text-[#35d07f] font-bold font-mono flex items-center gap-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {Math.abs(variance)}d buffer
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#8e9ab0]">Critical Tasks:</span>
            <span className="text-[#ff4d4d] font-bold font-mono">{criticalCount}</span>
          </div>

          {/* Quick Scripted Demo Actions */}
          <div className="flex items-center gap-2 pl-3 border-l border-white/10">
            <button
              onClick={injectSteelDelayDemo}
              disabled={hasSteelDelay}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                hasSteelDelay
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#ffb020] to-[#ff4d4d] text-black shadow-md shadow-red-500/20'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              {hasSteelDelay ? 'Steel +6d' : '🔥 Inject Steel'}
            </button>
            <button
              onClick={resetDemo}
              className="p-1 px-2 rounded-xl text-xs bg-white/5 border border-white/10 text-[#8e9ab0] hover:text-white"
              title="Reset Demo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Gantt View Canvas */}
      <div className="flex-1 min-h-0">
        <GanttChart
          tasks={tasks}
          cpmResult={cpmResult}
          deliveries={deliveries}
          contractors={contractors}
          projectStartDate={project.startDate}
          statusDay={project.statusDay}
          targetDeadline={project.targetFinish}
          selectedTaskId={selectedTaskId}
          onSelectTask={setSelectedTaskId}
        />
      </div>
    </div>
  );
};
