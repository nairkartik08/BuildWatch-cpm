import React, { useState, useMemo } from 'react';
import type { Task, DelayEvent, Delivery, DelayCause } from '../../engine/types';
import { previewDelayImpact } from '../../engine/simulate';
import {
  X,
  AlertTriangle,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface AddDelayModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  delays: DelayEvent[];
  deliveries: Delivery[];
  initialTaskId?: string;
  statusDay: number;
  targetFinish: number;
  onConfirm: (data: {
    taskId: string;
    days: number;
    cause: DelayCause;
    note: string;
  }) => void;
}

export const AddDelayModal: React.FC<AddDelayModalProps> = ({
  isOpen,
  onClose,
  tasks,
  delays,
  deliveries,
  initialTaskId,
  statusDay,
  targetFinish,
  onConfirm,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    initialTaskId || tasks[0]?.id || ''
  );
  const [delayDays, setDelayDays] = useState<number>(4);
  const [cause, setCause] = useState<DelayCause>('weather');
  const [note, setNote] = useState<string>('');

  // Synchronize when initialTaskId changes
  React.useEffect(() => {
    if (initialTaskId) setSelectedTaskId(initialTaskId);
  }, [initialTaskId]);

  // Real-time live simulation calculation
  const preview = useMemo(() => {
    if (!selectedTaskId) return null;
    return previewDelayImpact({
      tasks,
      delays,
      deliveries,
      taskId: selectedTaskId,
      delayDays,
      cause,
      statusDay,
      targetFinish,
    });
  }, [tasks, delays, deliveries, selectedTaskId, delayDays, cause, statusDay, targetFinish]);

  if (!isOpen) return null;

  const currentTask = tasks.find((t) => t.id === selectedTaskId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId || delayDays <= 0) return;
    onConfirm({
      taskId: selectedTaskId,
      days: delayDays,
      cause,
      note: note.trim() || `Delay logged on ${currentTask?.name || selectedTaskId}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 font-sans">
      <div className="bg-[#141c2b] border border-[#232f44] rounded-md w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 px-6 border-b border-[#232f44] flex items-center justify-between bg-[#0f172a]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-red-500/10 text-red-400 border border-red-500/30">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-white text-sm">Log Delay Event</h3>
              <p className="text-[11px] text-slate-400">
                Calculates schedule variance and critical path impact before applying.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target Task Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Target Task or Material Arrival
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#232f44] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.isDelivery ? '📦 ' : '🔨 '}
                  {t.name} ({t.trade})
                </option>
              ))}
            </select>
          </div>

          {/* Days & Cause Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Delay Duration (Days)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={45}
                  value={delayDays}
                  onChange={(e) => setDelayDays(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-[#0f172a] border border-[#232f44] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono text-center font-bold"
                />
                <span className="text-xs text-slate-400">days</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Primary Delay Cause
              </label>
              <select
                value={cause}
                onChange={(e) => setCause(e.target.value as DelayCause)}
                className="w-full bg-[#0f172a] border border-[#232f44] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="delivery">Material / Delivery</option>
                <option value="weather">Weather Delay</option>
                <option value="resource">Crew / Subcontractor</option>
                <option value="other">Other Site Issue</option>
              </select>
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Reason / Field Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Weather disruption, supplier delay, design clarification..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#232f44] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-500"
            />
          </div>

          {/* Live Preview Card */}
          {preview && (
            <div
              className={`p-3.5 rounded border ${
                preview.absorbedByFloat
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Schedule Impact Preview
                </span>
                <span className="text-xs font-mono font-bold">
                  {preview.netProjectSlip > 0 ? (
                    <span className="text-red-400">+{preview.netProjectSlip}d Project Slip</span>
                  ) : (
                    <span className="text-emerald-400">0d Project Slip (Absorbed)</span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 font-mono">
                  <span className="text-slate-400">Day {preview.baselineFinish}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <strong className="text-white font-bold">
                    Day {preview.simulatedFinish}
                  </strong>
                </div>

                <div className="text-[11px]">
                  {preview.absorbedByFloat ? (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Absorbed by task float ({preview.floatRemaining}d float remaining).
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-400">
                      <TrendingDown className="w-3.5 h-3.5" />
                      Pushes project finish past target deadline!
                    </span>
                  )}
                </div>
              </div>

              {preview.switchedCriticalPath && (
                <div className="mt-2 pt-2 border-t border-red-500/20 text-[11px] text-amber-400 flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Warning: Injected delay shifts the critical path!
                </div>
              )}
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-xs font-semibold text-slate-400 hover:text-white bg-[#0f172a] border border-[#232f44]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition-colors cursor-pointer"
            >
              Log Delay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
