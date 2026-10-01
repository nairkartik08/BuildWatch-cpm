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
    <div className="flex flex-col h-full bg-[#0d121c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Top Controls Toolbar */}
      <div className="p-3 px-5 bg-[#121823]/90 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold text-white">
            <GitFork className="w-4 h-4 text-[#4da3ff]" />
            <span>Dependency Network & Blast Radar</span>
          </div>

          <span className="text-[#8e9ab0]">|</span>

          {/* Active blast summary if selected */}
          {blastRadius && selectedTask ? (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl text-amber-300 font-medium">
              <Zap className="w-3.5 h-3.5 text-[#ffb020] animate-pulse" />
              <span>
                Simulated <strong>{selectedTask.name}</strong> +5d delay ➔{' '}
                <strong>{blastRadius.affectedCount}</strong> downstream tasks slipped
                {blastRadius.projectSlipDays > 0 ? ` (+${blastRadius.projectSlipDays}d overall)` : ' (absorbed)'}
              </span>
              <button
                onClick={() => onSelectTask(null)}
                className="text-amber-400 hover:text-white ml-1 p-0.5"
                title="Clear selection"
              >
                ✕
              </button>
            </div>
          ) : (
            <span className="text-[#8e9ab0] italic">
              Click any task card to trace its downstream delay blast radius
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Orientation switch */}
          <button
            onClick={() => setDirection((d) => (d === 'LR' ? 'TB' : 'LR'))}
            className="px-3 py-1.5 rounded-xl bg-[#0b0f16] border border-white/10 text-slate-300 hover:text-white flex items-center gap-1.5 transition-all text-xs"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Layout: {direction === 'LR' ? 'Horizontal (Left-Right)' : 'Vertical (Top-Down)'}</span>
          </button>

          {selectedTaskId && (
            <button
              onClick={() => onSelectTask(null)}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[#8e9ab0] hover:text-white flex items-center gap-1.5 transition-all text-xs"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Selection
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
          className="bg-[#0b0f16]"
        >
          <Background
            color="#2a3547"
            gap={20}
            size={1.5}
            variant={BackgroundVariant.Dots}
          />
          <Controls className="!bg-[#121926] !border-white/10 !rounded-xl !overflow-hidden [&>button]:!bg-[#121926] [&>button]:!border-white/10 [&>button]:!text-white hover:[&>button]:!bg-white/10" />
          <MiniMap
            nodeStrokeColor="#ffffff"
            nodeColor={(node: any) => {
              if (node.data?.cpm?.critical) return '#ff4d4d';
              if (node.data?.cpm?.nearCritical) return '#ffb020';
              if (node.data?.task?.isDelivery) return '#4da3ff';
              return '#35d07f';
            }}
            maskColor="rgba(11, 15, 22, 0.85)"
            className="!bg-[#121926] !border !border-white/10 !rounded-xl overflow-hidden"
          />
        </ReactFlow>
      </div>
    </div>
  );
};
