import React, { useState, useMemo } from 'react';
import type { Task, DelayEvent, Delivery, DelayCause } from '../../engine/types';
import { previewDelayImpact } from '../../engine/simulate';
import {
  X,
  AlertTriangle,
  TrendingDown,
  Sparkles,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121926] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 px-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-500/10 text-[#ff4d4d]">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-white text-sm">Simulate & Log Delay Event</h3>
              <p className="text-[11px] text-[#8e9ab0]">
                Live forward/backward pass recalculates project slip before applying.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#8e9ab0] hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target Task Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Target Task or Material Delivery
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full bg-[#0b0f16] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#ffb020]"
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
                  className="w-full bg-[#0b0f16] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ffb020] font-mono text-center font-bold"
                />
                <span className="text-xs text-[#8e9ab0]">days</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Primary Delay Cause
              </label>
              <select
                value={cause}
                onChange={(e) => setCause(e.target.value as DelayCause)}
                className="w-full bg-[#0b0f16] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ffb020]"
              >
                <option value="delivery">Material / Delivery</option>
                <option value="weather">Weather / Environment</option>
                <option value="resource">Crew / Resource Shortage</option>
                <option value="other">Other / Site Issue</option>
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
              placeholder="e.g. Heavy rain flooded basement pit; batching plant outage..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[#0b0f16] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ffb020] placeholder-slate-600"
            />
          </div>

          {/* Live Preview Card */}
          {preview && (
            <div
              className={`p-4 rounded-xl border transition-all ${
                preview.absorbedByFloat
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Live Schedule Impact Preview
                </span>
                <span className="text-xs font-mono font-bold">
                  {preview.netProjectSlip > 0 ? (
                    <span className="text-[#ff4d4d]">+{preview.netProjectSlip}d Project Slip</span>
                  ) : (
                    <span className="text-[#35d07f]">0d Project Slip (Safe)</span>
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
                    <span className="flex items-center gap-1 text-[#35d07f]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Absorbed by task float ({preview.floatRemaining}d remaining).
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[#ff4d4d]">
                      <TrendingDown className="w-3.5 h-3.5" />
                      Pushes project completion past deadline!
                    </span>
                  )}
                </div>
              </div>

              {preview.switchedCriticalPath && (
                <div className="mt-2 pt-2 border-t border-red-500/20 text-[11px] text-[#ffb020] flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Warning: Injected delay switches the project's critical path!
                </div>
              )}
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8e9ab0] hover:text-white bg-white/5 border border-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#ffb020] to-[#ff4d4d] text-black shadow-lg shadow-red-500/20 hover:opacity-90 transition-opacity"
            >
              Apply Delay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
