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
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [selectedContractor, setSelectedContractor] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');
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
  const sites = Array.from(new Set(tasks.map((t) => t.site)));

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.site.toLowerCase().includes(search.toLowerCase()) ||
      t.trade.toLowerCase().includes(search.toLowerCase());

    const matchesTrade = selectedTrade === 'all' || t.trade === selectedTrade;
    const matchesSite = selectedSite === 'all' || t.site === selectedSite;
    const matchesContractor = selectedContractor === 'all' || t.contractorId === selectedContractor;
    const taskStatus = t.percentComplete >= 100 ? 'completed' : t.percentComplete > 0 ? 'in_progress' : 'not_started';
    const matchesStatus = selectedStatus === 'all' || taskStatus === selectedStatus;
    const matchesType =
      filterType === 'all' ||
      (filterType === 'delivery' && t.isDelivery) ||
      (filterType === 'task' && !t.isDelivery);

    return matchesSearch && matchesTrade && matchesSite && matchesContractor && matchesStatus && matchesType;
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
    <div className="space-y-5 font-sans">
      {/* Header controls & Demo action buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            Task Management & Delay Register
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
              {tasks.length} total tasks
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track site completion, log delays, manage contractors, and update progress.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setTaskToEdit(null);
              setTaskEditModalOpen(true);
            }}
            className="px-3 py-1.5 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Task
          </button>
          <button
            onClick={() => {
              setSelectedTaskForDelay(undefined);
              setDelayModalOpen(true);
            }}
            className="px-3 py-1.5 rounded text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CircleAlert className="w-3.5 h-3.5" />
            Log Delay Event
          </button>
          <button
            onClick={injectSteelDelayDemo}
            disabled={hasSteelDelay}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              hasSteelDelay
                ? 'bg-red-950/60 text-red-400 border border-red-800/60 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            {hasSteelDelay ? 'Steel Delay Injected (+6d)' : 'Simulate Steel Delay (+6d)'}
          </button>
          <button
            onClick={resetDemo}
            className="px-3 py-1.5 rounded text-xs font-semibold bg-[#0f172a] text-slate-400 border border-[#232f44] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#141c2b] border border-[#232f44] rounded p-3 flex items-center gap-3">
          <div className="p-2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Construction Tasks</div>
            <div className="text-lg font-bold text-white font-mono">
              {tasks.filter((t) => !t.isDelivery).length}
            </div>
          </div>
        </div>

        <div className="bg-[#141c2b] border border-[#232f44] rounded p-3 flex items-center gap-3">
          <div className="p-2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Material Deliveries</div>
            <div className="text-lg font-bold text-white font-mono">{deliveries.length}</div>
          </div>
        </div>

        <div className="bg-[#141c2b] border border-[#232f44] rounded p-3 flex items-center gap-3">
          <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <HardHat className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Contractors</div>
            <div className="text-lg font-bold text-white font-mono">{contractors.length}</div>
          </div>
        </div>

        <div className="bg-[#141c2b] border border-[#232f44] rounded p-3 flex items-center gap-3">
          <div className="p-2 rounded bg-red-500/10 text-red-400 border border-red-500/20">
            <CircleAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Active Delays Logged</div>
            <div className="text-lg font-bold text-red-400 font-mono">{delays.length}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#141c2b] border border-[#232f44] p-3 rounded">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks, materials, trades, sites..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-[#0f172a] border border-[#232f44] rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-[#0f172a] border border-[#232f44] rounded px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Task Types</option>
            <option value="task">Construction Tasks</option>
            <option value="delivery">Deliveries Only</option>
          </select>

          <select
            value={selectedTrade}
            onChange={(e) => setSelectedTrade(e.target.value)}
            className="bg-[#0f172a] border border-[#232f44] rounded px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Trades</option>
            {trades.map((trade) => (
              <option key={trade} value={trade}>
                {trade}
              </option>
            ))}
          </select>

          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            aria-label="Filter by site"
            className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#ffb020]"
          >
            <option value="all">All Sites</option>
            {sites.map((site) => <option key={site} value={site}>{site}</option>)}
          </select>

          <select
            value={selectedContractor}
            onChange={(e) => setSelectedContractor(e.target.value)}
            aria-label="Filter by contractor"
            className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#ffb020]"
          >
            <option value="all">All Contractors</option>
            {contractors.map((contractor) => <option key={contractor.id} value={contractor.id}>{contractor.name}</option>)}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as typeof selectedStatus)}
            aria-label="Filter by status"
            className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#ffb020]"
          >
            <option value="all">All Statuses</option>
            <option value="not_started">Not started</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="border border-[#232f44] rounded bg-[#141c2b] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0f172a] text-slate-400 uppercase font-bold text-[11px] tracking-wider border-b border-[#232f44]">
              <tr>
                <th className="py-3 px-4">Task Name & Trade</th>
                <th className="py-3 px-3">Location / Site</th>
                <th className="py-3 px-3">Contractor</th>
                <th className="py-3 px-3 text-center">Duration (Days)</th>
                <th className="py-3 px-3">Predecessors</th>
                <th className="py-3 px-3 text-center">Progress</th>
                <th className="py-3 px-3 text-center font-mono">Delay</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232f44] font-normal">
              {filteredTasks.map((t) => {
                const contractor = t.contractorId ? contractorMap.get(t.contractorId) : null;
                const taskDelays = getTaskDelayDays(t.id);
                const isFinished = t.percentComplete === 100;
                const isInProgress = t.percentComplete > 0 && t.percentComplete < 100;

                return (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-default"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {t.isDelivery ? (
                          <span className="p-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <Package className="w-3.5 h-3.5" />
                          </span>
                        ) : isFinished ? (
                          <CheckCircle2 className="w-4 h-4 text-slate-500" />
                        ) : isInProgress ? (
                          <Clock className="w-4 h-4 text-blue-400" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-slate-600 ml-1" />
                        )}
                        <div>
                          <span className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {t.name}
                          </span>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                            <span>{t.id}</span>
                            <span>•</span>
                            <span className="text-slate-300">{t.trade}</span>
                            {t.outdoor && (
                              <span className="px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Outdoor
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
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
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
                          {t.assignedResource && <div className="mt-0.5 text-[10px] text-slate-400">Crew: {t.assignedResource}</div>}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Self-delivered</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center font-mono">
                      {t.isDelivery ? (
                        <span className="text-blue-400 text-[11px]">Material Arrival</span>
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
                              className="px-1.5 py-0.5 bg-[#0f172a] border border-[#232f44] rounded text-[10px] font-mono text-slate-300"
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
                        <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden border border-slate-700">
                          <div
                            className={`h-full ${
                              isFinished
                                ? 'bg-slate-500'
                                : isInProgress
                                ? 'bg-blue-500'
                                : 'bg-transparent'
                            }`}
                            style={{ width: `${t.percentComplete}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-mono">
                      {taskDelays > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                          +{taskDelays}d slip
                        </span>
                      ) : (
                        <span className="text-slate-500">0d</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!t.isDelivery && (
                          <button
                            onClick={() => openProgressModalForTask(t)}
                            className="p-1.5 rounded bg-[#0f172a] text-blue-400 hover:text-white border border-[#232f44] hover:border-slate-600 transition-colors text-[10px] cursor-pointer"
                            title="Update progress"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setTaskForComments(t);
                            setCommentsModalOpen(true);
                          }}
                          className="p-1.5 rounded bg-[#0f172a] text-amber-400 hover:text-white border border-[#232f44] hover:border-slate-600 transition-colors text-[10px] cursor-pointer"
                          title="Field notes & comments"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDelayModalForTask(t.id)}
                          className="p-1.5 rounded bg-[#0f172a] text-red-400 hover:text-white border border-[#232f44] hover:border-slate-600 transition-colors text-[10px] cursor-pointer"
                          title="Inject delay"
                        >
                          <CircleAlert className="w-3.5 h-3.5" />
                        </button>
                        {!t.isDelivery && (
                          <>
                            <button
                              onClick={() => {
                                setTaskToEdit(t);
                                setTaskEditModalOpen(true);
                              }}
                              className="p-1.5 rounded bg-[#0f172a] text-slate-300 hover:text-white border border-[#232f44] hover:border-slate-600 transition-colors text-[10px] cursor-pointer"
                              title="Edit task"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete task "${t.name}"?`)) {
                                  deleteTask(t.id);
                                }
                              }}
                              className="p-1.5 rounded bg-[#0f172a] text-slate-400 hover:text-red-400 border border-[#232f44] hover:border-slate-600 transition-colors text-[10px] cursor-pointer"
                              title="Delete task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        key={`${taskForComments?.id ?? 'none'}-${commentsModalOpen}`}
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
        key={`${taskForProgress?.id ?? 'none'}-${progressModalOpen}`}
        isOpen={progressModalOpen}
        onClose={() => setProgressModalOpen(false)}
        task={taskForProgress}
        statusDay={project.statusDay}
        onUpdate={(id, updates) => updateTask(id, updates)}
      />
    </div>
  );
};
