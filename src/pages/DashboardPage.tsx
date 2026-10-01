import React, { useMemo, useState } from 'react';
import { useProjectStore } from '../store';
import {
  calculateCPM,
  runMonteCarlo,
  calculateBlastRadius,
  calculateRecoveryOptions,
} from '../engine';
import {
  Zap,
  RotateCcw,
  PlusCircle,
  TrendingDown,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    tasks,
    delays,
    deliveries,
    contractors,
    project,
    addDelay,
    removeDelay,
    injectSteelDelayDemo,
    resetDemo,
    updateTask,
  } = useProjectStore();

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [delayInputTaskId, setDelayInputTaskId] = useState<string>(tasks[0]?.id || '');
  const [delayDays, setDelayDays] = useState<number>(5);
  const [delayCause, setDelayCause] = useState<'delivery' | 'weather' | 'resource' | 'other'>('delivery');

  // 1. Current CPM calculations
  const cpmCurrent = useMemo(() => {
    return calculateCPM({
      tasks,
      delays,
      deliveries,
      statusDay: project.statusDay,
      targetFinish: project.targetFinish,
    });
  }, [tasks, delays, deliveries, project.statusDay, project.targetFinish]);

  // Baseline CPM without any delays for ghost bar comparison
  const cpmBaseline = useMemo(() => {
    return calculateCPM({
      tasks,
      delays: [],
      deliveries,
      statusDay: project.statusDay,
      targetFinish: project.targetFinish,
    });
  }, [tasks, deliveries, project.statusDay, project.targetFinish]);

  // 2. Monte Carlo 600 iterations
  const monteCarlo = useMemo(() => {
    return runMonteCarlo({
      tasks,
      delays,
      contractors,
      targetFinish: project.targetFinish,
      statusDay: project.statusDay,
      iterations: 600,
      seed: 42,
    });
  }, [tasks, delays, contractors, project.targetFinish, project.statusDay]);

  // 3. Blast radius for selected task
  const blastRadius = useMemo(() => {
    if (!selectedTaskId) return null;
    return calculateBlastRadius({
      tasks,
      delays,
      sourceTaskId: selectedTaskId,
      injectedDays: 5,
      statusDay: project.statusDay,
      targetFinish: project.targetFinish,
    });
  }, [selectedTaskId, tasks, delays, project.statusDay, project.targetFinish]);

  // 4. Candidate recovery options
  const recoveryActions = useMemo(() => {
    return calculateRecoveryOptions({
      tasks,
      delays,
      deliveries,
      statusDay: project.statusDay,
      targetFinish: project.targetFinish,
    });
  }, [tasks, delays, deliveries, project.statusDay, project.targetFinish]);

  const targetDeadline = project.targetFinish;
  const projectFinish = cpmCurrent.projectFinish;
  const variance = Math.round((projectFinish - targetDeadline) * 10) / 10;
  const isOverDeadline = variance > 0;

  const confPercent = Math.round(monteCarlo.probOnTime * 100);
  const confBadgeStyle =
    confPercent >= 75
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      : confPercent >= 50
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      : 'bg-red-500/10 text-red-400 border-red-500/30';

  const criticalCount = cpmCurrent.criticalPath.length;
  const nearCriticalCount = Object.values(cpmCurrent.tasks).filter((t) => t.nearCritical).length;

  const scaleMax = Math.max(projectFinish, targetDeadline, cpmBaseline.projectFinish, 70) + 4;
  const toPercent = (val: number) => `${Math.min(100, Math.max(0, (val / scaleMax) * 100))}%`;

  // Histogram bins (16 bins)
  const histData = useMemo(() => {
    if (monteCarlo.finishDates.length === 0) return { bins: [], lo: 0, hi: 0, maxFreq: 1, step: 1 };
    const lo = Math.floor(monteCarlo.finishDates[0]);
    const hi = Math.ceil(monteCarlo.finishDates[monteCarlo.finishDates.length - 1]);
    const binCount = 16;
    const step = Math.max(1, (hi - lo + 1) / binCount);
    const bins = new Array(binCount).fill(0);

    for (const f of monteCarlo.finishDates) {
      const idx = Math.min(binCount - 1, Math.floor((f - lo) / step));
      bins[idx]++;
    }
    const maxFreq = Math.max(...bins, 1);
    return { bins, lo, hi, maxFreq, step };
  }, [monteCarlo.finishDates]);

  // Top delay risks by Monte Carlo Criticality Index
  const topRisks = useMemo(() => {
    return Object.entries(monteCarlo.criticalityIndex)
      .map(([taskId, score]) => ({
        task: tasks.find((t) => t.id === taskId)!,
        score,
      }))
      .filter((item) => item.task)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [monteCarlo.criticalityIndex, tasks]);

  // Delay cause breakdown
  const delayAttribution = useMemo(() => {
    const causes: Record<string, { days: number; color: string; label: string }> = {
      delivery: { days: 0, color: '#3b82f6', label: 'Material Arrival' },
      weather: { days: 0, color: '#f59e0b', label: 'Weather Delay' },
      resource: { days: 0, color: '#ef4444', label: 'Crew / Resource' },
      other: { days: 0, color: '#64748b', label: 'Other Causes' },
    };

    let total = 0;
    for (const d of delays) {
      if (causes[d.cause]) {
        causes[d.cause].days += d.days;
        total += d.days;
      }
    }

    return { causes, total };
  }, [delays]);

  // Dynamic alerts list
  const activeAlerts = useMemo(() => {
    const alerts: { color: string; text: string; category: string }[] = [];

    for (const d of delays) {
      const t = tasks.find((item) => item.id === d.taskId);
      if (t?.isDelivery) {
        alerts.push({
          color: '#ef4444',
          category: 'Delivery Late',
          text: `${t.name.replace('📦 Material Arrival: ', '')}: +${d.days}d (${d.cause})`,
        });
      } else {
        alerts.push({
          color: '#f59e0b',
          category: 'Task Delay',
          text: `${t?.name ?? d.taskId}: +${d.days}d (${d.cause})`,
        });
      }
    }

    for (const [taskId, res] of Object.entries(cpmCurrent.tasks)) {
      if (res.nearCritical) {
        const t = tasks.find((item) => item.id === taskId);
        alerts.push({
          color: '#f59e0b',
          category: 'Low Float',
          text: `${t?.name ?? taskId}: Float reduced to ${res.float}d`,
        });
      }
    }

    if (monteCarlo.probOnTime < 0.7) {
      alerts.push({
        color: '#ef4444',
        category: 'Risk Alert',
        text: `On-time probability fell to ${confPercent}%`,
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        color: '#22c55e',
        category: 'Baseline Stable',
        text: 'Critical path on schedule with zero variance.',
      });
    }

    return alerts.slice(0, 6);
  }, [delays, tasks, cpmCurrent.tasks, monteCarlo.probOnTime, confPercent]);

  // Handle Add Delay
  const handleAddDelay = () => {
    if (!delayInputTaskId) return;
    const task = tasks.find((t) => t.id === delayInputTaskId);
    addDelay({
      taskId: delayInputTaskId,
      days: Math.max(1, delayDays),
      cause: delayCause,
      note: `Added manually for ${task?.name || delayInputTaskId}`,
    });
  };

  // Handle Apply Recovery
  const handleApplyRecovery = (action: (typeof recoveryActions)[0]) => {
    if (action.kind === 'Expedite') {
      const targetDelay = delays.find((d) => d.taskId === action.taskId);
      if (targetDelay) {
        if (targetDelay.days <= action.daysSaved) {
          removeDelay(targetDelay.id);
        } else {
          removeDelay(targetDelay.id);
          addDelay({
            taskId: action.taskId,
            days: targetDelay.days - action.daysSaved,
            cause: targetDelay.cause,
            note: 'Reduced by expedite delivery action',
          });
        }
      }
    } else if (action.kind === 'Crash') {
      const task = tasks.find((t) => t.id === action.taskId);
      if (task) {
        updateTask(task.id, {
          durationLikely: Math.max(1, task.durationLikely - action.daysSaved),
        });
      }
    }
  };

  const hasSteelDelay = delays.some((d) => d.taskId === 'task-del-steel');

  return (
    <div className="space-y-4 pb-12 font-sans">
      {/* Action Toolbar */}
      <div className="bg-[#141c2b] border border-[#232f44] rounded-md p-3.5 px-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="font-bold text-white text-sm">Hospital Wing B — Construction Schedule</span>
          <span className="text-slate-500">|</span>
          <span className="text-xs text-slate-300">
            Target Completion: <strong className="text-white font-mono">Day {targetDeadline}</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Select task to delay */}
          <select
            value={delayInputTaskId}
            onChange={(e) => setDelayInputTaskId(e.target.value)}
            className="bg-[#0f172a] border border-[#232f44] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 max-w-[180px] truncate"
          >
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name.replace('📦 Material Arrival: ', '📦 ')}
              </option>
            ))}
          </select>

          {/* Number of days */}
          <div className="flex items-center gap-1 bg-[#0f172a] border border-[#232f44] rounded px-2 py-1">
            <span className="text-[11px] text-slate-400 font-medium">Days:</span>
            <input
              type="number"
              min={1}
              max={20}
              value={delayDays}
              onChange={(e) => setDelayDays(parseInt(e.target.value) || 1)}
              className="w-10 bg-transparent text-xs text-center text-white font-bold focus:outline-none"
            />
          </div>

          {/* Cause */}
          <select
            value={delayCause}
            onChange={(e) => setDelayCause(e.target.value as any)}
            className="bg-[#0f172a] border border-[#232f44] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="delivery">Delivery</option>
            <option value="weather">Weather</option>
            <option value="resource">Crew</option>
            <option value="other">Other</option>
          </select>

          <button
            onClick={handleAddDelay}
            className="px-3 py-1.5 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Log Delay
          </button>

          <button
            onClick={injectSteelDelayDemo}
            disabled={hasSteelDelay}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              hasSteelDelay
                ? 'bg-red-950/60 text-red-400 border border-red-800/60 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            {hasSteelDelay ? 'Steel Delay Active (+6d)' : 'Simulate Steel Delay (+6d)'}
          </button>

          <button
            onClick={() => {
              setSelectedTaskId(null);
              resetDemo();
            }}
            className="px-3 py-1.5 rounded text-xs font-semibold bg-[#0f172a] text-slate-400 border border-[#232f44] hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Schedule
          </button>
        </div>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Metric 1: On-Time Probability */}
        <div className="md:col-span-3 bg-[#141c2b] border border-[#232f44] rounded-md p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              On-Time Probability
            </span>
            <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold border ${confBadgeStyle}`}>
              {confPercent}%
            </span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white font-mono">
              {confPercent}%
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Probability of finishing by Day <strong className="text-white font-mono">{targetDeadline}</strong>
            </p>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-[#232f44]">
            Based on 600 Monte Carlo iterations
          </div>
        </div>

        {/* Metric 2: Projected Finish Date */}
        <div className="md:col-span-3 bg-[#141c2b] border border-[#232f44] rounded-md p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Projected Completion
            </span>
            {isOverDeadline ? (
              <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 font-semibold flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> Over Deadline
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> On Schedule
              </span>
            )}
          </div>
          <div>
            <div className={`text-3xl font-extrabold font-mono ${isOverDeadline ? 'text-red-400' : 'text-white'}`}>
              Day {projectFinish}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isOverDeadline ? (
                <span className="text-red-400 font-semibold">+{variance} days behind target</span>
              ) : (
                <span className="text-emerald-400 font-semibold">{Math.abs(variance)} days ahead of deadline</span>
              )}
            </p>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-[#232f44]">
            Target Deadline: Day {targetDeadline}
          </div>
        </div>

        {/* Metric 3: Critical Path Tasks */}
        <div className="md:col-span-3 bg-[#141c2b] border border-[#232f44] rounded-md p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Critical Path Tasks
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 font-bold font-mono">
              0 Float
            </span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-red-400 font-mono">
              {criticalCount} <span className="text-sm font-normal text-slate-400">tasks</span>
            </div>
            <p className="text-xs text-amber-400 mt-1 font-medium">
              {nearCriticalCount} tasks near-critical (float ≤ 2d)
            </p>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-[#232f44]">
            Directly impact final finish date
          </div>
        </div>

        {/* Metric 4: P80 Confidence Date */}
        <div className="md:col-span-3 bg-[#141c2b] border border-[#232f44] rounded-md p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              P80 Realistic Finish
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono">
              80% Confidence
            </span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white font-mono">
              Day {monteCarlo.p80}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              80% of schedule simulations complete by this day
            </p>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-[#232f44] font-mono">
            P50: Day {monteCarlo.p50} · P90: Day {monteCarlo.p90}
          </div>
        </div>
      </div>

      {/* Main Schedule & Impact Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Schedule Timeline & Task Impact */}
        <div className="md:col-span-8 bg-[#141c2b] border border-[#232f44] rounded-md p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-[#232f44]">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Critical Path & Schedule Timeline
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Click any task to analyze downstream impact and float
              </p>
            </div>

            {/* Status Legend */}
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
                Critical (0 Float)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                Near Critical
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                On Track
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                Material Arrival
              </span>
            </div>
          </div>

          {blastRadius && (
            <div className="mb-3 p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
              <span>
                <strong>Impact Analysis for "{tasks.find((t) => t.id === selectedTaskId)?.name}":</strong>{' '}
                Injecting +5d delay affects <strong>{blastRadius.affectedCount} dependent tasks</strong>.
              </span>
              <span className="font-bold text-white font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                Project Finish: {blastRadius.projectSlipDays > 0 ? `+${blastRadius.projectSlipDays}d slip` : 'Unchanged'}
              </span>
            </div>
          )}

          {/* Interactive Gantt Chart List */}
          <div className="relative overflow-x-auto pt-1">
            <div className="min-w-[600px] relative space-y-1">
              {/* Target deadline vertical line */}
              <div
                className="absolute top-0 bottom-0 pointer-events-none border-l-2 border-dashed border-red-500 z-10 opacity-70"
                style={{ left: `calc(160px + ${toPercent(targetDeadline)})` }}
              >
                <span className="absolute -top-3 left-1 text-[10px] text-red-400 font-mono font-bold">
                  Target (Day {targetDeadline})
                </span>
              </div>

              {tasks.map((task) => {
                const res = cpmCurrent.tasks[task.id];
                const baseRes = cpmBaseline.tasks[task.id];
                if (!res || !baseRes) return null;

                const isSelected = selectedTaskId === task.id;
                const hit = blastRadius?.affectedTasks[task.id];

                // Determine bar background color
                let barColor = 'bg-emerald-600';
                if (res.critical) barColor = 'bg-red-600';
                else if (res.nearCritical) barColor = 'bg-amber-600';
                else if (task.isDelivery) barColor = 'bg-blue-600';

                const barWidth = Math.max(1.5, res.ef - res.es);
                const baseWidth = Math.max(1.5, baseRes.ef - baseRes.es);

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(isSelected ? null : task.id)}
                    className={`flex items-center h-7 rounded cursor-pointer transition-colors px-1 ${
                      isSelected
                        ? 'bg-blue-600/20 border border-blue-500/40'
                        : hit
                        ? 'bg-red-500/10 border border-red-500/20'
                        : 'hover:bg-slate-800/60'
                    }`}
                  >
                    {/* Task Title */}
                    <div
                      className={`w-40 text-xs truncate pr-2 shrink-0 ${
                        isSelected ? 'text-white font-bold' : 'text-slate-300'
                      }`}
                      title={task.name}
                    >
                      {task.name.replace('📦 Material Arrival: ', '📦 ')}
                    </div>

                    {/* Timeline Track */}
                    <div className="flex-1 relative h-full">
                      {/* Ghost baseline bar */}
                      <div
                        className="absolute top-1.5 h-3.5 border border-slate-600/60 rounded bg-slate-800/30 pointer-events-none"
                        style={{
                          left: toPercent(baseRes.es),
                          width: toPercent(baseWidth),
                        }}
                      />

                      {/* Current active CPM bar */}
                      <div
                        className={`absolute top-1.5 h-3.5 rounded text-[10px] font-bold text-white pl-1.5 leading-[14px] whitespace-nowrap transition-all duration-300 ${barColor}`}
                        style={{
                          left: toPercent(res.es),
                          width: toPercent(barWidth),
                        }}
                      >
                        {hit ? `+${hit.slipDays}d` : res.critical ? '' : `Float: ${res.float}d`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Schedule Alerts & Risk Log */}
        <div className="md:col-span-4 bg-[#141c2b] border border-[#232f44] rounded-md p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#232f44]">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Schedule Risk Alerts
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
              {activeAlerts.length} items
            </span>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[380px] pr-1">
            {activeAlerts.map((al, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded text-xs border-l-4 bg-[#0f172a] border-[#232f44]"
                style={{ borderLeftColor: al.color }}
              >
                <div className="font-semibold text-white mb-0.5 flex items-center justify-between">
                  <span>{al.category}</span>
                </div>
                <div className="text-slate-300 leading-relaxed">{al.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Risk Analysis, Critical Index, Delay Causes */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Monte Carlo Completion Histogram */}
        <div className="md:col-span-5 bg-[#141c2b] border border-[#232f44] rounded-md p-4 shadow-sm">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
            Schedule Completion Risk Distribution (600 Runs)
          </h3>

          <div className="flex items-end gap-1.5 h-36 pt-4 border-b border-[#232f44]">
            {histData.bins.map((count, i) => {
              const binDay = histData.lo + i * histData.step;
              const isPastDeadline = binDay > targetDeadline;
              const heightPct = Math.round((count / histData.maxFreq) * 100);

              return (
                <div
                  key={i}
                  title={`Day ${Math.round(binDay)}: ${count} simulated runs`}
                  style={{ height: `${Math.max(6, heightPct)}%` }}
                  className={`flex-1 rounded-t transition-all ${
                    isPastDeadline ? 'bg-red-600' : 'bg-blue-600'
                  }`}
                />
              );
            })}
          </div>

          <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
            <span>Day {histData.lo}</span>
            <span className="text-red-400 font-bold">Target: Day {targetDeadline}</span>
            <span>Day {histData.hi}</span>
          </div>
        </div>

        {/* Criticality Index (Task Delay Vulnerability) */}
        <div className="md:col-span-4 bg-[#141c2b] border border-[#232f44] rounded-md p-4 shadow-sm">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
            Task Delay Risk Index
          </h3>

          <div className="space-y-2">
            {topRisks.map(({ task, score }) => (
              <div
                key={task.id}
                className="grid grid-cols-12 gap-2 items-center text-xs py-1 border-b border-[#232f44] last:border-0"
              >
                <span className="col-span-6 truncate text-slate-300 font-medium" title={task.name}>
                  {task.name.replace('📦 Material Arrival: ', '📦 ')}
                </span>
                <div className="col-span-4 h-2 bg-slate-800 rounded overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded"
                    style={{ width: `${Math.round(score * 100)}%` }}
                  />
                </div>
                <span className="col-span-2 text-right font-mono font-bold text-white">
                  {Math.round(score * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Delays Log */}
        <div className="md:col-span-3 bg-[#141c2b] border border-[#232f44] rounded-md p-4 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              Delay Attribution
            </h3>

            <div className="h-5 rounded overflow-hidden flex bg-slate-800 mb-3 border border-slate-700">
              {Object.entries(delayAttribution.causes).map(([key, item]) => {
                const widthPct =
                  delayAttribution.total > 0
                    ? (item.days / delayAttribution.total) * 100
                    : 0;
                if (widthPct === 0) return null;
                return (
                  <div
                    key={key}
                    style={{ width: `${widthPct}%`, backgroundColor: item.color }}
                    title={`${item.label}: ${item.days} days`}
                    className="h-full"
                  />
                );
              })}
            </div>

            <div className="space-y-1 text-xs text-slate-300 mb-3">
              {Object.entries(delayAttribution.causes).map(([key, item]) => (
                <div key={key} className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </span>
                  <span className="font-mono font-bold">{item.days}d</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1 max-h-36 overflow-y-auto pt-2 border-t border-[#232f44]">
            {delays.length === 0 ? (
              <div className="text-xs text-slate-500 italic">No active delays logged</div>
            ) : (
              delays.map((d) => {
                const t = tasks.find((item) => item.id === d.taskId);
                return (
                  <div
                    key={d.id}
                    className="flex items-center justify-between text-xs p-1.5 rounded bg-[#0f172a] border border-[#232f44]"
                  >
                    <span className="truncate text-slate-300 pr-1">
                      {t?.name.replace('📦 Material Arrival: ', '')} (+{d.days}d)
                    </span>
                    <button
                      onClick={() => removeDelay(d.id)}
                      className="text-slate-400 hover:text-red-400 p-0.5 cursor-pointer"
                      title="Remove delay"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recovery Plan & Schedule Compression */}
      <div className="bg-[#141c2b] border border-[#232f44] rounded-md p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#232f44]">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Schedule Recovery Plan (Ranked by Days Saved per ₹ Lakh)
          </h3>
          <span className="text-xs text-slate-400">
            Recommended crash & expedite options
          </span>
        </div>

        {recoveryActions.length === 0 ? (
          <div className="text-xs text-slate-400 py-4 text-center">
            No recovery action needed: critical path is optimal.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {recoveryActions.map((action, idx) => {
              const isBest = idx === 0;

              return (
                <div
                  key={action.id}
                  className={`flex flex-col justify-between p-3 rounded border transition-colors ${
                    isBest
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-[#232f44] bg-[#0f172a]'
                  }`}
                >
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">
                        {action.title}
                      </span>
                      {isBest && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500 text-black font-bold uppercase">
                          Best ROI
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Saves <strong className="text-white font-mono">{action.daysSaved}d</strong> · Cost: ₹
                      {action.costInLakhs.toFixed(2)}L
                    </p>
                    <div className="text-[10px] text-amber-400 font-mono mt-1">
                      Efficiency: {action.roi} days saved / ₹Lakh
                    </div>
                  </div>

                  <button
                    onClick={() => handleApplyRecovery(action)}
                    className={`w-full py-1.5 px-3 rounded text-xs font-bold transition-colors cursor-pointer ${
                      isBest
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    Apply Recovery Action
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
