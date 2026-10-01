import React, { useState } from 'react';
import type { Task, Contractor } from '../../engine/types';
import { topologicalSort } from '../../engine/cpm';
import { X, Check, AlertCircle, Plus, Edit2 } from 'lucide-react';

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  tasks: Task[];
  contractors: Contractor[];
  onSave: (task: Task) => void;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  tasks,
  contractors,
  onSave,
}) => {
  const isEditing = !!taskToEdit;

  const [name, setName] = useState(taskToEdit?.name || '');
  const [trade, setTrade] = useState(taskToEdit?.trade || 'Civil');
  const [site, setSite] = useState(taskToEdit?.site || 'Wing B');
  const [contractorId, setContractorId] = useState<string>(taskToEdit?.contractorId || contractors[0]?.id || '');
  const [assignedResource, setAssignedResource] = useState(taskToEdit?.assignedResource || '');
  const [durationMin, setDurationMin] = useState<number>(taskToEdit?.durationMin ?? 3);
  const [durationLikely, setDurationLikely] = useState<number>(taskToEdit?.durationLikely ?? 5);
  const [durationMax, setDurationMax] = useState<number>(taskToEdit?.durationMax ?? 8);
  const [outdoor, setOutdoor] = useState<boolean>(taskToEdit?.outdoor ?? false);
  const [predecessors, setPredecessors] = useState<string[]>(taskToEdit?.predecessors || []);
  const [predSearch, setPredSearch] = useState('');
  const [cycleError, setCycleError] = useState<string | null>(null);

  // Synchronize on taskToEdit change
  React.useEffect(() => {
    if (taskToEdit) {
      setName(taskToEdit.name);
      setTrade(taskToEdit.trade);
      setSite(taskToEdit.site);
      setContractorId(taskToEdit.contractorId || '');
      setAssignedResource(taskToEdit.assignedResource || '');
      setDurationMin(taskToEdit.durationMin);
      setDurationLikely(taskToEdit.durationLikely);
      setDurationMax(taskToEdit.durationMax);
      setOutdoor(taskToEdit.outdoor);
      setPredecessors(taskToEdit.predecessors || []);
    } else {
      setName('');
      setTrade('Civil');
      setSite('Wing B');
      setContractorId(contractors[0]?.id || '');
      setAssignedResource('');
      setDurationMin(3);
      setDurationLikely(5);
      setDurationMax(8);
      setOutdoor(false);
      setPredecessors([]);
    }
    setCycleError(null);
  }, [taskToEdit, contractors, isOpen]);

  if (!isOpen) return null;

  // Available tasks to pick as predecessors (excluding self)
  const candidatePredecessors = tasks.filter((t) => !taskToEdit || t.id !== taskToEdit.id);
  const filteredCandidates = candidatePredecessors.filter((t) =>
    t.name.toLowerCase().includes(predSearch.toLowerCase()) ||
    t.trade.toLowerCase().includes(predSearch.toLowerCase())
  );

  const togglePredecessor = (id: string) => {
    setCycleError(null);
    if (predecessors.includes(id)) {
      setPredecessors(predecessors.filter((p) => p !== id));
    } else {
      setPredecessors([...predecessors, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const taskId = taskToEdit ? taskToEdit.id : `task-user-${Date.now()}`;
    const updatedTask: Task = {
      id: taskId,
      name: name.trim(),
      trade: trade.trim(),
      site: site.trim(),
      contractorId: contractorId || undefined,
      assignedResource: assignedResource.trim() || undefined,
      durationMin: Math.max(1, durationMin),
      durationLikely: Math.max(durationMin, durationLikely),
      durationMax: Math.max(durationLikely, durationMax),
      predecessors,
      outdoor,
      percentComplete: taskToEdit?.percentComplete ?? 0,
      actualStart: taskToEdit?.actualStart,
      actualFinish: taskToEdit?.actualFinish,
      isDelivery: taskToEdit?.isDelivery ?? false,
      deliveryId: taskToEdit?.deliveryId,
      crashable: taskToEdit?.crashable,
    };

    // Cycle check before committing!
    const candidateTasks = isEditing
      ? tasks.map((t) => (t.id === taskId ? updatedTask : t))
      : [...tasks, updatedTask];

    try {
      topologicalSort(candidateTasks);
      onSave(updatedTask);
      onClose();
    } catch (err: any) {
      setCycleError(err.message || 'Circular dependency cycle detected!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 font-sans">
      <div className="bg-[#141c2b] border border-[#232f44] rounded-md w-full max-w-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 px-6 border-b border-[#232f44] flex items-center justify-between bg-[#0f172a]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {isEditing ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </span>
            <div>
              <h3 className="font-bold text-white text-sm">
                {isEditing ? 'Edit Construction Task' : 'Create Construction Task'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Define duration estimates (min/likely/max) and predecessor dependencies.
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Cycle detection warning */}
          {cycleError && (
            <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{cycleError}</span>
            </div>
          )}

          {/* Name & Site */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Task Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. L3 HVAC Duct Installation"
                className="w-full bg-[#0f172a] border border-[#232f44] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Trade</label>
              <input
                type="text"
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                placeholder="e.g. Concrete & Steel"
                className="w-full bg-[#0f172a] border border-[#232f44] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Site / Zone</label>
              <input
                type="text"
                value={site}
                onChange={(e) => setSite(e.target.value)}
                placeholder="e.g. Wing B Level 3"
                className="w-full bg-[#0f172a] border border-[#232f44] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Contractor, resource and weather exposure */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contractor</label>
              <select
                value={contractorId}
                onChange={(e) => setContractorId(e.target.value)}
                className="w-full bg-[#0f172a] border border-[#232f44] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">No contractor (Self-delivered)</option>
                {contractors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.reliability}x)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned resource / crew</label>
              <input
                type="text"
                value={assignedResource}
                onChange={(e) => setAssignedResource(e.target.value)}
                placeholder="e.g. 8-person formwork crew"
                className="w-full bg-[#0b0f16] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ffb020]"
              />
            </div>

            <div className="col-span-2 flex items-center">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={outdoor}
                  onChange={(e) => setOutdoor(e.target.checked)}
                  className="rounded bg-[#0f172a] border-[#232f44] text-blue-500 focus:ring-0 w-4 h-4"
                />
                <span>Outdoor task (weather delay risk)</span>
              </label>
            </div>
          </div>

          {/* Durations (Min / Likely / Max) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Estimated Duration Range (Days)
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Best Case (Min)</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={durationMin}
                  onChange={(e) => setDurationMin(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#0f172a] border border-[#232f44] rounded px-3 py-1.5 text-xs text-white text-center font-mono"
                />
              </div>

              <div>
                <span className="text-[10px] text-blue-400 font-bold block mb-1">Likely (Planned)</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={durationLikely}
                  onChange={(e) => setDurationLikely(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#0f172a] border border-blue-500/40 rounded px-3 py-1.5 text-xs text-white text-center font-mono font-bold"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Worst Case (Max)</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={durationMax}
                  onChange={(e) => setDurationMax(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#0f172a] border border-[#232f44] rounded px-3 py-1.5 text-xs text-white text-center font-mono"
                />
              </div>
            </div>
          </div>

          {/* Dependency Multi-Select */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Predecessor Tasks ({predecessors.length} selected)
              </label>
              <input
                type="text"
                placeholder="Filter tasks..."
                value={predSearch}
                onChange={(e) => setPredSearch(e.target.value)}
                className="bg-[#0f172a] border border-[#232f44] rounded px-2 py-0.5 text-[11px] text-white focus:outline-none w-36"
              />
            </div>

            <div className="border border-[#232f44] rounded bg-[#0f172a] p-2 max-h-40 overflow-y-auto space-y-1">
              {filteredCandidates.map((cand) => {
                const isChecked = predecessors.includes(cand.id);
                return (
                  <div
                    key={cand.id}
                    onClick={() => togglePredecessor(cand.id)}
                    className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-blue-600/20 border border-blue-500/30 text-white'
                        : 'hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="font-semibold text-slate-200 block truncate">
                        {cand.isDelivery ? '📦 ' : ''}
                        {cand.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {cand.trade} · Planned: {cand.durationLikely}d
                      </span>
                    </div>
                    {isChecked ? (
                      <span className="p-0.5 rounded bg-blue-600 text-white">
                        <Check className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="w-3.5 h-3.5 rounded border border-slate-600" />
                    )}
                  </div>
                );
              })}
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
              {isEditing ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
