import React, { useMemo } from 'react';
import { useProjectStore } from '../store';
import { calculateCPM } from '../engine';
import { DependencyGraph } from '../components/Graph/DependencyGraph';
import { Zap, RotateCcw } from 'lucide-react';

export const GraphPage: React.FC = () => {
  const {
    tasks,
    delays,
    deliveries,
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

  const hasSteelDelay = delays.some((d) => d.taskId === 'task-del-steel');

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] space-y-4">
      {/* Top Banner KPI Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0 bg-[#121926]/80 border border-white/10 p-3.5 px-5 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            Interactive Dependency Graph & Blast Radius
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
              React Flow + Dagre
            </span>
          </h2>
          <p className="text-xs text-[#8e9ab0]">
            Red borders show zero-float critical nodes · Red pulsating arrows show critical path handoffs
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={injectSteelDelayDemo}
            disabled={hasSteelDelay}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              hasSteelDelay
                ? 'bg-red-500/20 text-red-300 border border-red-500/30 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#ffb020] to-[#ff4d4d] text-black shadow-md shadow-red-500/20'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            {hasSteelDelay ? '⚡ Steel Slipped (+6d)' : '⚡ Inject Steel Delay'}
          </button>
          <button
            onClick={resetDemo}
            className="p-1.5 px-3 rounded-xl text-xs bg-white/5 border border-white/10 text-[#8e9ab0] hover:text-white flex items-center gap-1"
            title="Reset Demo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Main Dependency Graph Canvas */}
      <div className="flex-1 min-h-0">
        <DependencyGraph
          tasks={tasks}
          cpmResult={cpmResult}
          delays={delays}
          statusDay={project.statusDay}
          targetFinish={project.targetFinish}
          selectedTaskId={selectedTaskId}
          onSelectTask={setSelectedTaskId}
        />
      </div>
    </div>
  );
};
