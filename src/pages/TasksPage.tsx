import React, { useState } from 'react';
import { useProjectStore } from '../store';
import { AddDelayModal } from '../components/Tasks/AddDelayModal';
import { ProgressModal } from '../components/Tasks/ProgressModal';
import { TaskEditModal } from '../components/Tasks/TaskEditModal';
import type { Task } from '../engine/types';
import {
  Search,
  Filter,
  Package,
  HardHat,
  RotateCcw,
  Zap,
  CheckCircle2,
  CheckSquare,
  Clock,
  CircleAlert,
  Plus,
  Sliders,
  Edit2,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import { TaskCommentsModal } from '../components/Collab/TaskCommentsModal';

export const TasksPage: React.FC = () => {
  const {
    tasks,
    contractors,
    deliveries,
    delays,
    project,
    addDelay,
    updateTask,
    injectSteelDelayDemo,
    resetDemo,
  } = useProjectStore();

  const [search, setSearch] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'delivery' | 'task'>('all');

  // Modal states
  const [delayModalOpen, setDelayModalOpen] = useState(false);
  const [selectedTaskForDelay, setSelectedTaskForDelay] = useState<string | undefined>(undefined);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [taskForProgress, setTaskForProgress] = useState<Task | null>(null);
  const [taskEditModalOpen, setTaskEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [taskForComments, setTaskForComments] = useState<Task | null>(null);

  const { addTask, deleteTask } = useProjectStore();

  const contractorMap = new Map(contractors.map((c) => [c.id, c]));
  const trades = Array.from(new Set(tasks.map((t) => t.trade)));

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.site.toLowerCase().includes(search.toLowerCase()) ||
      t.trade.toLowerCase().includes(search.toLowerCase());

    const matchesTrade = selectedTrade === 'all' || t.trade === selectedTrade;
    const matchesType =
      filterType === 'all' ||
      (filterType === 'delivery' && t.isDelivery) ||
      (filterType === 'task' && !t.isDelivery);

    return matchesSearch && matchesTrade && matchesType;
  });

  const getTaskDelayDays = (taskId: string) => {
    return delays
      .filter((d) => d.taskId === taskId)
      .reduce((sum, d) => sum + d.days, 0);
  };

  const hasSteelDelay = delays.some((d) => d.taskId === 'task-del-steel');

  const openDelayModalForTask = (taskId: string) => {
    setSelectedTaskForDelay(taskId);
    setDelayModalOpen(true);
  };

  const openProgressModalForTask = (task: Task) => {
    setTaskForProgress(task);
    setProgressModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header controls & Demo action buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Tasks, Progress & Delays Register
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
              {tasks.length} total
            </span>
          </h2>
          <p className="text-xs text-[#8e9ab0]">
            Update task progress, log verified delays with live preview, or test scripted ripples.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTaskToEdit(null);
              setTaskEditModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#35d07f] text-black hover:bg-emerald-400 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
          >
            <Plus className="w-3.5 h-3.5" />
            New Task
          </button>
          <button
            onClick={() => {
              setSelectedTaskForDelay(undefined);
              setDelayModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#ffb020] text-black hover:bg-amber-400 transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/10"
          >
            <CircleAlert className="w-3.5 h-3.5" />
            Log Delay Event
          </button>
          <button
            onClick={injectSteelDelayDemo}
            disabled={hasSteelDelay}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              hasSteelDelay
                ? 'bg-red-500/20 text-red-300 border border-red-500/30 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#ffb020] to-[#ff4d4d] text-black hover:opacity-90 shadow-md shadow-red-500/20'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            {hasSteelDelay ? '⚡ Steel Delay Injected' : '⚡ Inject Steel Delay'}
          </button>
          <button
            onClick={resetDemo}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#121823] text-slate-300 border border-white/10 hover:border-white/20 hover:text-white flex items-center gap-2 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#121823]/70 border border-white/10 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-[#8e9ab0]">Work Tasks</div>
            <div className="text-lg font-bold text-white">
              {tasks.filter((t) => !t.isDelivery).length}
            </div>
          </div>
        </div>

        <div className="bg-[#121823]/70 border border-white/10 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-[#ffb020]">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-[#8e9ab0]">Material Deliveries</div>
            <div className="text-lg font-bold text-[#ffb020]">{deliveries.length}</div>
          </div>
        </div>

        <div className="bg-[#121823]/70 border border-white/10 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <HardHat className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-[#8e9ab0]">Contractors</div>
            <div className="text-lg font-bold text-emerald-400">{contractors.length}</div>
          </div>
        </div>

        <div className="bg-[#121823]/70 border border-white/10 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10 text-[#ff4d4d]">
            <CircleAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-[#8e9ab0]">Active Delay Events</div>
            <div className="text-lg font-bold text-[#ff4d4d]">{delays.length}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121823]/60 border border-white/10 p-3 rounded-2xl">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#8e9ab0] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks, materials, trades, sites..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#ffb020] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#8e9ab0]" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#ffb020]"
          >
            <option value="all">All Types</option>
            <option value="task">Standard Tasks</option>
            <option value="delivery">Deliveries Only</option>
          </select>

          <select
            value={selectedTrade}
            onChange={(e) => setSelectedTrade(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#ffb020]"
          >
            <option value="all">All Trades</option>
            {trades.map((trade) => (
              <option key={trade} value={trade}>
                {trade}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="border border-white/10 rounded-2xl bg-[#0e1420]/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.04] text-[#8e9ab0] uppercase font-semibold text-[11px] tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3 px-4">Task Name & Trade</th>
                <th className="py-3 px-3">Location / Site</th>
                <th className="py-3 px-3">Contractor</th>
                <th className="py-3 px-3 text-center">Dur (Min/Likely/Max)</th>
                <th className="py-3 px-3">Dependencies</th>
                <th className="py-3 px-3 text-center">Progress</th>
                <th className="py-3 px-3 text-center">Delays</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-normal">
              {filteredTasks.map((t) => {
                const contractor = t.contractorId ? contractorMap.get(t.contractorId) : null;
                const taskDelays = getTaskDelayDays(t.id);
                const isFinished = t.percentComplete === 100;
                const isInProgress = t.percentComplete > 0 && t.percentComplete < 100;

                return (
                  <tr
                    key={t.id}
                    className="hover:bg-white/[0.02] transition-colors group cursor-default"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {t.isDelivery ? (
                          <span className="p-1 rounded bg-amber-500/10 text-[#ffb020]">
                            <Package className="w-3.5 h-3.5" />
                          </span>
                        ) : isFinished ? (
                          <CheckCircle2 className="w-4 h-4 text-slate-500" />
                        ) : isInProgress ? (
                          <Clock className="w-4 h-4 text-[#4da3ff] animate-pulse" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-slate-600 ml-1" />
                        )}
                        <div>
                          <span className="font-semibold text-white group-hover:text-[#ffb020] transition-colors">
                            {t.name}
                          </span>
                          <div className="text-[10px] text-[#8e9ab0] flex items-center gap-2 mt-0.5">
                            <span className="text-slate-400 font-mono">{t.id}</span>
                            <span>•</span>
                            <span className="text-amber-400/90">{t.trade}</span>
                            {t.outdoor && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-[#ffb020] text-[9px] border border-amber-500/20">
                                ☀️ Outdoor
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-300">{t.site}</td>

                    <td className="py-3 px-3">
                      {contractor ? (
                        <div>
                          <span className="text-slate-200">{contractor.name}</span>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <span>Reliability:</span>
                            <span
                              className={
                                contractor.reliability > 1.1
                                  ? 'text-red-400 font-bold'
                                  : contractor.reliability < 0.95
                                  ? 'text-emerald-400 font-bold'
                                  : 'text-slate-300'
                              }
                            >
                              {contractor.reliability}x
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Self-delivered / In-house</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center font-mono">
                      {t.isDelivery ? (
                        <span className="text-amber-400 text-[11px]">Milestone</span>
                      ) : (
                        <span className="text-slate-300">
                          {t.durationMin} / <strong className="text-white">{t.durationLikely}d</strong> / {t.durationMax}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {t.predecessors.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {t.predecessors.map((pId) => (
                            <span
                              key={pId}
                              className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] font-mono text-slate-300"
                            >
                              {pId.replace('task-', '')}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="w-20 mx-auto">
                        <div className="flex justify-between text-[10px] mb-1 font-mono">
                          <span
                            className={
                              isFinished
                                ? 'text-slate-400'
                                : isInProgress
                                ? 'text-blue-400 font-bold'
                                : 'text-slate-500'
                            }
                          >
                            {t.percentComplete}%
                          </span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isFinished
                                ? 'bg-slate-500'
                                : isInProgress
                                ? 'bg-[#4da3ff]'
                                : 'bg-transparent'
                            }`}
                            style={{ width: `${t.percentComplete}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {taskDelays > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-[#ff4d4d] border border-red-500/30 font-mono">
                          +{taskDelays}d slip
                        </span>
                      ) : (
                        <span className="text-slate-600 font-mono">0d</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!t.isDelivery && (
                          <button
                            onClick={() => openProgressModalForTask(t)}
                            className="p-1 px-1.5 rounded-lg bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/20 flex items-center gap-1 transition-colors text-[10px]"
                            title="Update progress"
                          >
                            <Sliders className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setTaskForComments(t);
                            setCommentsModalOpen(true);
                          }}
                          className="p-1 px-1.5 rounded-lg bg-amber-500/10 text-[#ffb020] hover:bg-amber-500/20 border border-amber-500/20 flex items-center gap-1 transition-colors text-[10px]"
                          title="Field notes & comments"
                        >
                          <MessageSquare className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => openDelayModalForTask(t.id)}
                          className="p-1 px-1.5 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/20 flex items-center gap-1 transition-colors text-[10px]"
                          title="Inject delay"
                        >
                          <CircleAlert className="w-3 h-3" />
                        </button>
                        {!t.isDelivery && (
                          <>
                            <button
                              onClick={() => {
                                setTaskToEdit(t);
                                setTaskEditModalOpen(true);
                              }}
                              className="p-1 px-1.5 rounded-lg bg-white/5 text-slate-300 hover:text-white border border-white/10 hover:border-white/20 transition-colors text-[10px]"
                              title="Edit task"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete task "${t.name}"?`)) {
                                  deleteTask(t.id);
                                }
                              }}
                              className="p-1 px-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-[#ff4d4d] border border-white/10 hover:border-red-500/30 transition-colors text-[10px]"
                              title="Delete task"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <TaskEditModal
        isOpen={taskEditModalOpen}
        onClose={() => setTaskEditModalOpen(false)}
        taskToEdit={taskToEdit}
        tasks={tasks}
        contractors={contractors}
        onSave={(savedTask) => {
          if (taskToEdit) {
            updateTask(savedTask.id, savedTask);
          } else {
            addTask(savedTask);
          }
        }}
      />

      <TaskCommentsModal
        isOpen={commentsModalOpen}
        onClose={() => setCommentsModalOpen(false)}
        task={taskForComments}
      />

      <AddDelayModal
        isOpen={delayModalOpen}
        onClose={() => setDelayModalOpen(false)}
        tasks={tasks}
        delays={delays}
        deliveries={deliveries}
        initialTaskId={selectedTaskForDelay}
        statusDay={project.statusDay}
        targetFinish={project.targetFinish}
        onConfirm={(data) => addDelay(data)}
      />

      <ProgressModal
        isOpen={progressModalOpen}
        onClose={() => setProgressModalOpen(false)}
        task={taskForProgress}
        statusDay={project.statusDay}
        onUpdate={(id, updates) => updateTask(id, updates)}
      />
    </div>
  );
};
