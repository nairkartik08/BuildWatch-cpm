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
  let borderColor = 'border-white/10';
  let badgeColor = 'bg-white/10 text-slate-300';
  let accentBar = 'bg-[#35d07f]';

  if (isCritical) {
    borderColor = 'border-[#ff4d4d]/80';
    badgeColor = 'bg-red-500/20 text-[#ff4d4d]';
    accentBar = 'bg-[#ff4d4d]';
  } else if (isNearCritical) {
    borderColor = 'border-[#ffb020]/80';
    badgeColor = 'bg-amber-500/20 text-[#ffb020]';
    accentBar = 'bg-[#ffb020]';
  } else if (isDelivery) {
    borderColor = 'border-[#4da3ff]/80';
    badgeColor = 'bg-blue-500/20 text-[#4da3ff]';
    accentBar = 'bg-[#4da3ff]';
  }

  return (
    <div
      onClick={() => onClick(task.id)}
      className={`relative w-56 rounded-xl bg-[#121926] border text-xs shadow-xl transition-all cursor-pointer ${borderColor} ${
        isSelected
          ? 'ring-2 ring-[#ffb020] shadow-[0_0_20px_rgba(255,176,32,0.4)] -translate-y-1'
          : isHit
          ? 'ring-2 ring-red-500 shadow-[0_0_20px_rgba(255,77,77,0.4)] animate-pulse'
          : 'hover:border-white/30 hover:-translate-y-0.5'
      }`}
    >
      {/* Target handle (incoming predecessor dependencies) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-[#8e9ab0] !border-2 !border-[#0b0f16]"
      />

      {/* Accent top line */}
      <div className={`h-1 w-full rounded-t-xl ${accentBar}`} />

      <div className="p-3">
        {/* Header badges */}
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <div className="flex items-center gap-1.5 truncate">
            {isDelivery ? (
              <Package className="w-3.5 h-3.5 text-[#4da3ff] shrink-0" />
            ) : task.percentComplete === 100 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            ) : task.percentComplete > 0 ? (
              <Clock className="w-3.5 h-3.5 text-[#4da3ff] shrink-0 animate-pulse" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-slate-600 ml-0.5" />
            )}
            <span className="text-[10px] font-mono text-[#8e9ab0] truncate">
              {task.id.replace('task-', '')}
            </span>
          </div>

          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold font-mono ${badgeColor}`}>
            {isCritical ? 'CRITICAL' : `${cpm?.float}d float`}
          </span>
        </div>

        {/* Task Name */}
        <div className="font-bold text-white text-xs truncate leading-snug" title={task.name}>
          {task.name.replace('📦 Material Arrival: ', '📦 ')}
        </div>

        {/* Trade & Duration */}
        <div className="flex items-center justify-between text-[11px] text-[#8e9ab0] mt-2 pt-2 border-t border-white/5">
          <span className="truncate max-w-[100px]">{task.trade}</span>
          <span className="font-mono text-slate-300 font-semibold">
            {isDelivery ? 'Milestone' : `d${cpm?.es} → d${cpm?.ef}`}
          </span>
        </div>

        {/* Blast radius impact banner */}
        {blastImpact && (
          <div className="mt-2 p-1.5 rounded-lg bg-red-500/20 text-[#ff4d4d] border border-red-500/30 font-mono text-[10px] font-bold text-center flex items-center justify-center gap-1">
            <span>+{blastImpact.slipDays}d slip</span>
            <span className="text-slate-400 font-normal">
              (d{blastImpact.originalEf} → d{blastImpact.newEf})
            </span>
          </div>
        )}
      </div>

      {/* Source handle (outgoing successor dependencies) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-[#8e9ab0] !border-2 !border-[#0b0f16]"
      />
    </div>
  );
};
