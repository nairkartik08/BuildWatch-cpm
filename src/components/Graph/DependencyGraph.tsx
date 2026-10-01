import React, { useMemo, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Task, CPMProjectResult } from '../../engine/types';
import { calculateBlastRadius } from '../../engine/blast';
import { TaskNode } from './TaskNode';
import { getLayoutedElements } from './graphLayout';
import {
  GitFork,
  ArrowRightLeft,
  RotateCcw,
  Zap,
} from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  cpmResult: CPMProjectResult;
  delays: any[];
  statusDay: number;
  targetFinish: number;
  selectedTaskId: string | null;
  onSelectTask: (id: string | null) => void;
}

const nodeTypes = {
  taskNode: TaskNode,
};

export const DependencyGraph: React.FC<DependencyGraphProps> = ({
  tasks,
  cpmResult,
  delays,
  statusDay,
  targetFinish,
  selectedTaskId,
  onSelectTask,
}) => {
  const [direction, setDirection] = useState<'LR' | 'TB'>('LR');

  // Compute blast radius when a node is selected
  const blastRadius = useMemo(() => {
    if (!selectedTaskId) return null;
    return calculateBlastRadius({
      tasks,
      delays,
      sourceTaskId: selectedTaskId,
      injectedDays: 5,
      statusDay,
      targetFinish,
    });
  }, [selectedTaskId, tasks, delays, statusDay, targetFinish]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    return getLayoutedElements(
      tasks,
      cpmResult,
      selectedTaskId,
      blastRadius,
      (id) => onSelectTask(selectedTaskId === id ? null : id),
      direction
    );
  }, [tasks, cpmResult, selectedTaskId, blastRadius, onSelectTask, direction]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Sync state when props or layout direction changes
  React.useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = getLayoutedElements(
      tasks,
      cpmResult,
      selectedTaskId,
      blastRadius,
      (id) => onSelectTask(selectedTaskId === id ? null : id),
      direction
    );
    // Directly update internal React Flow elements
    nodes.splice(0, nodes.length, ...newNodes);
    edges.splice(0, edges.length, ...newEdges);
  }, [tasks, cpmResult, selectedTaskId, blastRadius, direction]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  return (
    <div className="flex flex-col h-full bg-[#141c2b] border border-[#232f44] rounded-md overflow-hidden shadow-sm relative font-sans">
      {/* Top Controls Toolbar */}
      <div className="p-2.5 px-4 bg-[#0f172a] border-b border-[#232f44] flex flex-wrap items-center justify-between gap-3 text-xs z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold text-white">
            <GitFork className="w-4 h-4 text-blue-400" />
            <span>Dependency Network</span>
          </div>

          <span className="text-slate-600">|</span>

          {/* Active blast summary if selected */}
          {blastRadius && selectedTask ? (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded text-amber-300 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Simulated delay on <strong>{selectedTask.name}</strong> (+5d) ➔{' '}
                <strong>{blastRadius.affectedCount}</strong> dependent tasks impacted
                {blastRadius.projectSlipDays > 0 ? ` (+${blastRadius.projectSlipDays}d finish slip)` : ' (absorbed by float)'}
              </span>
              <button
                onClick={() => onSelectTask(null)}
                className="text-amber-400 hover:text-white ml-1 p-0.5 cursor-pointer"
                title="Clear selection"
              >
                ✕
              </button>
            </div>
          ) : (
            <span className="text-slate-400 text-xs">
              Click any task card to calculate downstream schedule impact
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Orientation switch */}
          <button
            onClick={() => setDirection((d) => (d === 'LR' ? 'TB' : 'LR'))}
            className="px-3 py-1.5 rounded bg-[#141c2b] border border-[#232f44] text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors text-xs cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Layout: {direction === 'LR' ? 'Horizontal (Left-to-Right)' : 'Vertical (Top-to-Bottom)'}</span>
          </button>

          {selectedTaskId && (
            <button
              onClick={() => onSelectTask(null)}
              className="px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors text-xs cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Clear Selection
            </button>
          )}
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={initialNodes}
          edges={initialEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          className="bg-[#0c1017]"
        >
          <Background
            color="#232f44"
            gap={24}
            size={1}
            variant={BackgroundVariant.Dots}
          />
          <Controls className="!bg-[#0f172a] !border-[#232f44] !rounded !overflow-hidden [&>button]:!bg-[#0f172a] [&>button]:!border-[#232f44] [&>button]:!text-white hover:[&>button]:!bg-slate-800" />
          <MiniMap
            nodeStrokeColor="#ffffff"
            nodeColor={(node: any) => {
              if (node.data?.cpm?.critical) return '#ef4444';
              if (node.data?.cpm?.nearCritical) return '#f59e0b';
              if (node.data?.task?.isDelivery) return '#3b82f6';
              return '#22c55e';
            }}
            maskColor="rgba(12, 16, 23, 0.85)"
            className="!bg-[#0f172a] !border !border-[#232f44] !rounded overflow-hidden"
          />
        </ReactFlow>
      </div>
    </div>
  );
};
