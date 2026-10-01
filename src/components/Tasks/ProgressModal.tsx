import React, { useState } from 'react';
import type { Task } from '../../engine/types';
import { X, Clock } from 'lucide-react';

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  statusDay: number;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
  isOpen,
  onClose,
  task,
  statusDay,
  onUpdate,
}) => {
  const [percent, setPercent] = useState<number>(task?.percentComplete ?? 0);
  const [actualStart, setActualStart] = useState<number | undefined>(task?.actualStart ?? statusDay);
  const [actualFinish, setActualFinish] = useState<number | undefined>(task?.actualFinish);

  React.useEffect(() => {
    if (task) {
      setPercent(task.percentComplete);
      setActualStart(task.actualStart ?? statusDay);
      setActualFinish(task.actualFinish);
    }
  }, [task, statusDay, isOpen]);

  if (!isOpen || !task) return null;

  const handlePercentChange = (newVal: number) => {
    setPercent(newVal);
    if (newVal === 100 && actualFinish === undefined) {
      setActualFinish(statusDay);
    } else if (newVal < 100 && actualFinish !== undefined) {
      setActualFinish(undefined);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(task.id, {
      percentComplete: percent,
      actualStart: percent > 0 ? actualStart : undefined,
      actualFinish: percent === 100 ? actualFinish : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 font-sans">
      <div className="bg-[#141c2b] border border-[#232f44] rounded-md w-full max-w-md shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 px-6 border-b border-[#232f44] flex items-center justify-between bg-[#0f172a]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Clock className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-white text-sm">Update Task Progress</h3>
              <p className="text-[11px] text-slate-400">
                Log percentage completion and actual start/finish offsets.
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
          <div className="p-3 rounded bg-[#0f172a] border border-[#232f44]">
            <div className="text-xs font-bold text-white mb-0.5">{task.name}</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
              <span>{task.trade}</span>
              <span>•</span>
              <span>{task.site}</span>
              <span>•</span>
              <span>Planned: {task.durationLikely}d</span>
            </div>
          </div>

          {/* Progress Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <label className="font-semibold text-slate-300">Completion Percentage</label>
              <span className="font-mono font-bold text-blue-400 text-sm">{percent}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={percent}
              onChange={(e) => handlePercentChange(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>0% (Not Started)</span>
              <span>50%</span>
              <span>100% (Completed)</span>
            </div>
          </div>

          {/* Quick Percent Buttons */}
          <div className="flex gap-2">
            {[0, 25, 50, 75, 100].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePercentChange(p)}
                className={`flex-1 py-1 text-[11px] font-mono rounded border transition-colors cursor-pointer ${
                  percent === p
                    ? 'bg-blue-600 text-white font-bold border-blue-500'
                    : 'bg-[#0f172a] text-slate-400 border-[#232f44] hover:text-white'
                }`}
              >
                {p}%
              </button>
            ))}
          </div>

          {/* Actual Start and Actual Finish Days */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Actual Start Day
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={actualStart ?? ''}
                placeholder="Day offset"
                onChange={(e) =>
                  setActualStart(e.target.value ? parseInt(e.target.value) : undefined)
                }
                className="w-full bg-[#0f172a] border border-[#232f44] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Actual Finish Day
              </label>
              <input
                type="number"
                min={0}
                max={100}
                disabled={percent < 100}
                value={actualFinish ?? ''}
                placeholder={percent < 100 ? 'Requires 100%' : 'Day offset'}
                onChange={(e) =>
                  setActualFinish(e.target.value ? parseInt(e.target.value) : undefined)
                }
                className="w-full bg-[#0f172a] border border-[#232f44] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#232f44]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-xs font-semibold text-slate-400 hover:text-white bg-[#0f172a] border border-[#232f44]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
            >
              Save Progress
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
