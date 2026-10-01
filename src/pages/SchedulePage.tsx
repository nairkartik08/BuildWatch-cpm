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
    <div className="flex flex-col h-[calc(100vh-6rem)] space-y-4 font-sans">
      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0 bg-[#141c2b] border border-[#232f44] p-3.5 px-5 rounded-md shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            Master Construction Schedule (Gantt View)
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
              CPM Engine Active
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Red bars: Zero-float critical path · Green bars: On-track tasks with float · Blue bars: Material deliveries
          </p>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Projected:</span>
            <span className="font-bold text-white font-mono">Day {cpmResult.projectFinish}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Target:</span>
            <span className="font-bold text-white font-mono">Day {project.targetFinish}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Variance:</span>
            {isOver ? (
              <span className="text-red-400 font-bold font-mono flex items-center gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" />+{variance}d
              </span>
            ) : (
              <span className="text-emerald-400 font-bold font-mono flex items-center gap-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {Math.abs(variance)}d buffer
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Critical Tasks:</span>
            <span className="text-red-400 font-bold font-mono">{criticalCount}</span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 pl-3 border-l border-[#232f44]">
            <button
              onClick={injectSteelDelayDemo}
              disabled={hasSteelDelay}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                hasSteelDelay
                  ? 'bg-red-950/60 text-red-400 border border-red-800/60 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              {hasSteelDelay ? 'Steel +6d Active' : 'Simulate Steel Delay (+6d)'}
            </button>
            <button
              onClick={resetDemo}
              className="p-1 px-2.5 rounded text-xs bg-[#0f172a] border border-[#232f44] text-slate-400 hover:text-white transition-colors cursor-pointer"
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
