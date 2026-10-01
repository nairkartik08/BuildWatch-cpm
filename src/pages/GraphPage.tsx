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
    <div className="flex flex-col h-[calc(100vh-6rem)] space-y-4 font-sans">
      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0 bg-[#141c2b] border border-[#232f44] p-3.5 px-5 rounded-md shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            Task Dependency Network Diagram
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
              Auto-Layout Network
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Red bordered cards indicate zero-float critical path tasks. Click any task card to simulate downstream delay propagation.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={injectSteelDelayDemo}
            disabled={hasSteelDelay}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              hasSteelDelay
                ? 'bg-red-950/60 text-red-400 border border-red-800/60 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            {hasSteelDelay ? 'Steel Delay Active (+6d)' : 'Simulate Steel Delay (+6d)'}
          </button>
          <button
            onClick={resetDemo}
            className="p-1.5 px-3 rounded text-xs bg-[#0f172a] border border-[#232f44] text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
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
