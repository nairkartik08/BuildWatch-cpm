import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Task, CPMTaskResult } from '../../engine/types';
import type { DownstreamSlipImpact } from '../../engine/blast';
import { Package, CheckCircle2, Clock } from 'lucide-react';

export interface TaskNodeData extends Record<string, unknown> {
  task: Task;
  cpm: CPMTaskResult;
  isSelected: boolean;
  blastImpact?: DownstreamSlipImpact;
  onClick: (taskId: string) => void;
}

export const TaskNode: React.FC<{ data: TaskNodeData }> = ({ data }) => {
  const { task, cpm, isSelected, blastImpact, onClick } = data;

  const isCritical = cpm?.critical;
  const isNearCritical = cpm?.nearCritical;
  const isDelivery = task.isDelivery;
  const isHit = !!blastImpact;

  // Determine styling
  let borderColor = 'border-[#232f44]';
  let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
  let accentBar = 'bg-emerald-500';

  if (isCritical) {
    borderColor = 'border-red-500/80';
    badgeColor = 'bg-red-500/10 text-red-400 border-red-500/30';
    accentBar = 'bg-red-500';
  } else if (isNearCritical) {
    borderColor = 'border-amber-500/80';
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    accentBar = 'bg-amber-500';
  } else if (isDelivery) {
    borderColor = 'border-blue-500/80';
    badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    accentBar = 'bg-blue-500';
  }

  return (
    <div
      onClick={() => onClick(task.id)}
      className={`relative w-56 rounded-md bg-[#141c2b] border text-xs shadow transition-colors cursor-pointer font-sans ${borderColor} ${
        isSelected
          ? 'ring-2 ring-blue-500 bg-[#1e293b]'
          : isHit
          ? 'ring-2 ring-red-500 bg-red-950/20'
          : 'hover:border-slate-500'
      }`}
    >
      {/* Target handle (incoming predecessor dependencies) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-[#0c1017]"
      />

      {/* Accent top line */}
      <div className={`h-1 w-full rounded-t-md ${accentBar}`} />

      <div className="p-3">
        {/* Header badges */}
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <div className="flex items-center gap-1.5 truncate">
            {isDelivery ? (
              <Package className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            ) : task.percentComplete === 100 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : task.percentComplete > 0 ? (
              <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-slate-500 ml-0.5" />
            )}
            <span className="text-[10px] font-mono text-slate-400 truncate">
              {task.id.replace('task-', '')}
            </span>
          </div>

          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold font-mono border ${badgeColor}`}>
            {isCritical ? 'CRITICAL' : `${cpm?.float}d float`}
          </span>
        </div>

        {/* Task Name */}
        <div className="font-bold text-white text-xs truncate leading-snug" title={task.name}>
          {task.name.replace('📦 Material Arrival: ', '📦 ')}
        </div>

        {/* Trade & Duration */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-[#232f44]">
          <span className="truncate max-w-[100px] font-medium">{task.trade}</span>
          <span className="font-mono text-slate-200 font-semibold">
            {isDelivery ? 'Material' : `Day ${cpm?.es} → Day ${cpm?.ef}`}
          </span>
        </div>

        {/* Blast radius impact banner */}
        {blastImpact && (
          <div className="mt-2 p-1.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 font-mono text-[10px] font-bold text-center">
            +{blastImpact.slipDays}d slip (d{blastImpact.originalEf} → d{blastImpact.newEf})
          </div>
        )}
      </div>

      {/* Source handle (outgoing successor dependencies) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-[#0c1017]"
      />
    </div>
  );
};
