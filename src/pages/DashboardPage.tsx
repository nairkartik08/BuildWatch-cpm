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
  const confColor =
    confPercent >= 75 ? 'text-[#35d07f]' : confPercent >= 50 ? 'text-[#ffb020]' : 'text-[#ff4d4d]';
  const confStrokeColor =
    confPercent >= 75 ? '#35d07f' : confPercent >= 50 ? '#ffb020' : '#ff4d4d';

  const criticalCount = cpmCurrent.criticalPath.length;
  const nearCriticalCount = Object.values(cpmCurrent.tasks).filter((t) => t.nearCritical).length;

  const scaleMax = Math.max(projectFinish, targetDeadline, cpmBaseline.projectFinish, 70) + 4;
  const toPercent = (val: number) => `${Math.min(100, Math.max(0, (val / scaleMax) * 100))}%`;

  // Circular gauge circumference
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // ~314.16
  const strokeDashoffset = circumference * (1 - monteCarlo.probOnTime);

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
      delivery: { days: 0, color: '#4da3ff', label: 'Delivery' },
      weather: { days: 0, color: '#ffb020', label: 'Weather' },
      resource: { days: 0, color: '#ff4d4d', label: 'Crew' },
      other: { days: 0, color: '#9aa6b8', label: 'Other' },
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
    const alerts: { color: string; text: string }[] = [];

    // Late deliveries & delays
    for (const d of delays) {
      const t = tasks.find((item) => item.id === d.taskId);
      if (t?.isDelivery) {
        alerts.push({
          color: '#ff4d4d',
          text: `Late delivery: ${t.name.replace('📦 Material Arrival: ', '')} +${d.days}d (${d.cause})`,
        });
      } else {
        alerts.push({
          color: '#ffb020',
          text: `Delay slip: ${t?.name ?? d.taskId} +${d.days}d (${d.cause})`,
        });
      }
    }

    // Near-critical tasks
    for (const [taskId, res] of Object.entries(cpmCurrent.tasks)) {
      if (res.nearCritical) {
        const t = tasks.find((item) => item.id === taskId);
        alerts.push({
          color: '#ffb020',
          text: `Low buffer: ${t?.name ?? taskId} has only ${res.float}d float remaining`,
        });
      }
    }

    // Confidence warning
    if (monteCarlo.probOnTime < 0.7) {
      alerts.push({
        color: '#ff4d4d',
        text: `Deadline at risk: confidence dropped to ${confPercent}%`,
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        color: '#35d07f',
        text: 'All clear: baseline critical path stable, no schedule variance.',
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
      note: `Injected via interactive radar control on ${task?.name || delayInputTaskId}`,
    });
  };

  // Handle Apply Recovery
  const handleApplyRecovery = (action: (typeof recoveryActions)[0]) => {
    if (action.kind === 'Expedite') {
      const task = tasks.find((t) => t.id === action.taskId);
      if (!task) return;
      // Reduce delays on this delivery task by the saved days
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
      // Compress task likely duration
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
    <div className="space-y-4 pb-12">
      {/* Top Interactive Controls Toolbar */}
      <div className="bg-[#121926]/90 border border-white/10 rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff4d4d] animate-ping" />
            <span className="font-extrabold text-white text-sm tracking-wide">Hospital Wing A</span>
          </div>
          <span className="text-xs text-[#8e9ab0]">·</span>
          <span className="text-xs text-[#8e9ab0]">
            Target Deadline: <strong className="text-white">Day {targetDeadline}</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Select task to delay */}
          <select
            value={delayInputTaskId}
            onChange={(e) => setDelayInputTaskId(e.target.value)}
            className="bg-[#0b0f16] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#ffb020] max-w-[170px] truncate"
          >
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name.replace('📦 Material Arrival: ', '📦 ')}
              </option>
            ))}
          </select>

          {/* Number of days */}
          <input
            type="number"
            min={1}
            max={20}
            value={delayDays}
            onChange={(e) => setDelayDays(parseInt(e.target.value) || 1)}
            className="w-14 bg-[#0b0f16] border border-white/10 rounded-xl px-2 py-1.5 text-xs text-center text-white focus:outline-none focus:border-[#ffb020]"
          />

          {/* Cause */}
          <select
            value={delayCause}
            onChange={(e) => setDelayCause(e.target.value as any)}
            className="bg-[#0b0f16] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#ffb020]"
          >
            <option value="delivery">delivery</option>
            <option value="weather">weather</option>
            <option value="resource">crew</option>
            <option value="other">other</option>
          </select>

          <button
            onClick={handleAddDelay}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#121926] text-white border border-white/10 hover:border-[#ffb020] hover:text-[#ffb020] transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#ffb020]" />
            + Add delay
          </button>

          <button
            onClick={injectSteelDelayDemo}
            disabled={hasSteelDelay}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
              hasSteelDelay
                ? 'bg-red-500/20 text-red-300 border border-red-500/30 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#ffb020] to-[#ff4d4d] text-[#190a00] hover:-translate-y-0.5 shadow-red-500/20'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            {hasSteelDelay ? '🔥 Steel +6d (Injected)' : '🔥 Steel +6d'}
          </button>

          <button
            onClick={() => {
              setSelectedTaskId(null);
              resetDemo();
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0b0f16] text-[#8e9ab0] border border-white/10 hover:text-white transition-all flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            ↺ Reset
          </button>
        </div>
      </div>

      {/* Grid: 4 Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Card 1: Deadline Confidence Circular Gauge (Span 4) */}
        <div className="md:col-span-4 bg-[#121926] border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#8e9ab0] mb-3">
            Deadline Confidence
          </h3>
          <div className="flex items-center gap-4">
            <div className="relative w-28 h-28 shrink-0">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="12"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={confStrokeColor}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className={`text-2xl font-black tracking-tight ${confColor}`}>
                  {confPercent}%
                </span>
              </div>
            </div>

            <div>
              <b className={`text-3xl font-extrabold tracking-tight ${confColor} block`}>
                {confPercent}%
              </b>
              <small className="text-xs text-[#8e9ab0] leading-tight block mt-1">
                chance to finish by day <strong className="text-white">{targetDeadline}</strong>
              </small>
              <span className="text-[10px] text-slate-400 mt-2 block font-mono">
                600 simulated futures
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Projected Finish (Span 3) */}
        <div className="md:col-span-3 bg-[#121926] border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#8e9ab0] mb-1">
            Projected Finish
          </h3>
          <div>
            <b
              className={`text-4xl font-extrabold tracking-tight block ${
                isOverDeadline ? 'text-[#ff4d4d]' : 'text-white'
              }`}
            >
              Day {projectFinish}
            </b>
            <div className="mt-2 text-xs font-semibold">
              {isOverDeadline ? (
                <span className="text-[#ff4d4d] flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />+{variance}d over deadline
                </span>
              ) : (
                <span className="text-[#35d07f] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {Math.abs(variance)}d buffer remaining
                </span>
              )}
            </div>
          </div>
          <small className="text-[11px] text-[#8e9ab0] mt-2">Target: Day {targetDeadline}</small>
        </div>

        {/* Card 3: Critical Tasks (Span 2) */}
        <div className="md:col-span-2 bg-[#121926] border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#8e9ab0] mb-1">
            Critical Tasks
          </h3>
          <div>
            <b className="text-4xl font-extrabold tracking-tight text-[#ff4d4d] block">
              {criticalCount}
            </b>
            <div className="text-xs text-[#ffb020] mt-2 font-medium">
              {nearCriticalCount} near-critical
            </div>
          </div>
          <small className="text-[10px] text-[#8e9ab0] mt-2">Float ≤ 2 days</small>
        </div>

        {/* Card 4: P80 Finish (Span 3) */}
        <div className="md:col-span-3 bg-[#121926] border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#8e9ab0] mb-1">
            P80 Finish Date
          </h3>
          <div>
            <b className="text-4xl font-extrabold tracking-tight text-white block">
              Day {monteCarlo.p80}
            </b>
            <div className="text-xs text-[#8e9ab0] mt-2 font-medium">
              80% of simulated futures end by this day
            </div>
          </div>
          <small className="text-[10px] text-slate-400 mt-2 font-mono">
            P50: Day {monteCarlo.p50} · P90: Day {monteCarlo.p90}
          </small>
        </div>
      </div>

      {/* Row 2: Schedule & Blast Radius (Span 8) + Alerts (Span 4) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Schedule & Blast Radius */}
        <div className="md:col-span-8 bg-[#121926] border border-white/10 rounded-2xl p-5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#8e9ab0] flex items-center gap-2">
              Schedule · Click a task for blast radius
              {blastRadius && (
                <span className="text-[#ffb020] font-bold normal-case text-xs flex items-center gap-1">
                  ⚡ {tasks.find((t) => t.id === selectedTaskId)?.name} +5d →{' '}
                  {blastRadius.affectedCount} tasks hit, finish{' '}
                  {blastRadius.projectSlipDays > 0 ? `+${blastRadius.projectSlipDays}d` : 'unchanged'}
                </span>
              )}
            </h3>

            {/* Legend */}
            <div className="flex items-center gap-3 text-xs text-[#8e9ab0]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#ff4d4d]" />
                critical
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#ffb020]" />
                near-critical
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#35d07f]" />
                safe
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#4da3ff]" />
                delivery
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-[#8e9ab0]" />
                baseline ghost
              </span>
            </div>
          </div>

          {/* Interactive Gantt Chart with Ghost Bar and Deadline Marker */}
          <div className="relative overflow-x-auto pt-2">
            <div className="min-w-[620px] relative space-y-1">
              {/* Deadline vertical guide line */}
              <div
                className="absolute top-0 bottom-0 pointer-events-none border-l-2 border-dashed border-[#ff4d4d] z-10"
                style={{ left: `calc(160px + ${toPercent(targetDeadline)})` }}
              >
                <em className="absolute -top-3.5 left-1 text-[10px] text-[#ff4d4d] not-italic font-mono font-bold">
                  deadline (Day {targetDeadline})
                </em>
              </div>

              {tasks.map((task) => {
                const res = cpmCurrent.tasks[task.id];
                const baseRes = cpmBaseline.tasks[task.id];
                if (!res || !baseRes) return null;

                const isSelected = selectedTaskId === task.id;
                const hit = blastRadius?.affectedTasks[task.id];

                // Determine bar color
                let barColor = 'bg-[#35d07f]';
                if (res.critical) barColor = 'bg-[#ff4d4d]';
                else if (res.nearCritical) barColor = 'bg-[#ffb020]';
                else if (task.isDelivery) barColor = 'bg-[#4da3ff]';

                const barWidth = Math.max(1.5, res.ef - res.es);
                const baseWidth = Math.max(1.5, baseRes.ef - baseRes.es);

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(isSelected ? null : task.id)}
                    className={`flex items-center h-7 rounded-lg cursor-pointer transition-colors px-1 group ${
                      isSelected
                        ? 'bg-[#ffb020]/15'
                        : hit
                        ? 'bg-red-500/10'
                        : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    {/* Label */}
                    <div
                      className={`w-40 text-xs truncate pr-2 shrink-0 font-medium ${
                        isSelected ? 'text-white font-bold' : 'text-[#8e9ab0] group-hover:text-white'
                      }`}
                      title={task.name}
                    >
                      {task.name.replace('📦 Material Arrival: ', '📦 ')}
                    </div>

                    {/* Timeline Track */}
                    <div className="flex-1 relative h-full">
                      {/* Ghost baseline bar */}
                      <div
                        className="absolute top-1.5 h-3.5 border border-dashed border-[#8e9ab0]/50 rounded opacity-60 pointer-events-none transition-all duration-500"
                        style={{
                          left: toPercent(baseRes.es),
                          width: toPercent(baseWidth),
                        }}
                      />

                      {/* Current CPM active bar */}
                      <div
                        className={`absolute top-1.5 h-3.5 rounded text-[10px] font-bold text-black/90 pl-1.5 leading-[14px] whitespace-nowrap transition-all duration-500 shadow-sm ${barColor} ${
                          hit ? 'ring-2 ring-[#ffb020] shadow-[0_0_12px_rgba(255,176,32,0.8)]' : ''
                        }`}
                        style={{
                          left: toPercent(res.es),
                          width: toPercent(barWidth),
                        }}
                      >
                        {hit ? `+${hit.slipDays}d` : res.critical ? '' : `f${res.float}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Alerts & Notifications (Span 4) */}
        <div className="md:col-span-4 bg-[#121926] border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#8e9ab0] flex items-center gap-1.5">
              Alerts
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white font-mono">
                {activeAlerts.length}
              </span>
            </h3>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[380px] pr-1">
            {activeAlerts.map((al, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl text-xs font-medium border-l-4 transition-all"
                style={{
                  borderLeftColor: al.color,
                  backgroundColor: `${al.color}15`,
                  color: '#e9edf3',
                }}
              >
                {al.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Finish-date distribution (Span 5) + Top Delay Risks (Span 4) + Delay Attribution (Span 3) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Finish-Date Distribution (Span 5) */}
        <div className="md:col-span-5 bg-[#121926] border border-white/10 rounded-2xl p-5 shadow-lg">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#8e9ab0] mb-3">
            Finish-Date Distribution · 600 Simulations
          </h3>

          <div className="flex items-end gap-1.5 h-36 pt-4">
            {histData.bins.map((count, i) => {
              const binDay = histData.lo + i * histData.step;
              const isPastDeadline = binDay > targetDeadline;
              const heightPct = Math.round((count / histData.maxFreq) * 100);

              return (
                <div
                  key={i}
                  title={`Day ${Math.round(binDay)}: ${count} runs`}
                  style={{ height: `${Math.max(4, heightPct)}%` }}
                  className={`flex-1 rounded-t transition-all duration-700 cursor-pointer ${
                    isPastDeadline
                      ? 'bg-gradient-to-t from-[#7a1a1a] to-[#ff4d4d]'
                      : 'bg-gradient-to-t from-[#1b4d8a] to-[#4da3ff]'
                  }`}
                />
              );
            })}
          </div>

          <div className="flex justify-between text-xs text-[#8e9ab0] mt-2 font-mono">
            <span>Day {histData.lo}</span>
            <span className="text-[#ff4d4d] font-bold">▲ Day {targetDeadline} (Deadline)</span>
            <span>Day {histData.hi}</span>
          </div>
        </div>

        {/* Top Delay Risks / Criticality Index (Span 4) */}
        <div className="md:col-span-4 bg-[#121926] border border-white/10 rounded-2xl p-5 shadow-lg">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#8e9ab0] mb-3">
            Top Delay Risks · Criticality Index
          </h3>

          <div className="space-y-2">
            {topRisks.map(({ task, score }) => (
              <div
                key={task.id}
                className="grid grid-cols-12 gap-2 items-center text-xs py-1.5 border-b border-white/5"
              >
                <span className="col-span-6 truncate font-medium text-slate-300" title={task.name}>
                  {task.name.replace('📦 Material Arrival: ', '📦 ')}
                </span>
                <div className="col-span-4 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#ffb020] to-[#ff4d4d] rounded-full transition-all duration-700"
                    style={{ width: `${Math.round(score * 100)}%` }}
                  />
                </div>
                <b className="col-span-2 text-right font-mono text-white">
                  {Math.round(score * 100)}%
                </b>
              </div>
            ))}
          </div>
        </div>

        {/* Delay Attribution (Span 3) */}
        <div className="md:col-span-3 bg-[#121926] border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#8e9ab0] mb-3">
              Delay Attribution
            </h3>

            {/* Stacked Bar */}
            <div className="h-6 rounded-lg overflow-hidden flex bg-white/10 mb-3">
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
                    title={`${item.label}: ${item.days}d`}
                    className="h-full transition-all duration-500"
                  />
                );
              })}
            </div>

            {/* Legend Chips */}
            <div className="flex flex-wrap gap-2 text-xs text-[#8e9ab0] mb-4">
              {Object.entries(delayAttribution.causes).map(([key, item]) => (
                <span key={key} className="flex items-center gap-1.5 text-slate-300">
                  <span
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.label} <strong>{item.days}d</strong>
                </span>
              ))}
            </div>
          </div>

          {/* Delays list with remove button */}
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {delays.length === 0 ? (
              <div className="text-xs text-[#8e9ab0] italic">No active delays logged</div>
            ) : (
              delays.map((d) => {
                const t = tasks.find((item) => item.id === d.taskId);
                return (
                  <div
                    key={d.id}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white/5"
                  >
                    <span className="truncate pr-2 text-slate-300">
                      {t?.name.replace('📦 Material Arrival: ', '')} +{d.days}d
                    </span>
                    <button
                      onClick={() => removeDelay(d.id)}
                      className="text-slate-400 hover:text-[#ff4d4d] transition-colors p-1"
                      title="Remove delay"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Recovery Optimizer (Span 12) */}
      <div className="bg-[#121926] border border-white/10 rounded-2xl p-5 shadow-lg">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#8e9ab0] mb-3">
          Recovery Optimizer · Ranked by days saved per ₹ lakh
        </h3>

        {recoveryActions.length === 0 ? (
          <div className="text-xs text-[#8e9ab0] py-4 text-center">
            No action shortens the schedule right now: critical path is already optimal.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {recoveryActions.map((action, idx) => {
              const isBest = idx === 0;

              return (
                <div
                  key={action.id}
                  className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all ${
                    isBest
                      ? 'border-[#35d07f]/50 bg-[#35d07f]/5'
                      : 'border-white/10 bg-white/[0.02]'
                  }`}
                >
                  <div className="mb-3">
                    <b className="text-xs text-white block">
                      {isBest && <span className="text-[#35d07f] mr-1">⭐</span>}
                      {action.title}
                    </b>
                    <small className="text-[11px] text-[#8e9ab0] block mt-1">
                      {action.kind} · saves <strong className="text-white">{action.daysSaved}d</strong> · ₹
                      {action.costInLakhs.toFixed(2)}L ·{' '}
                      <span className="text-amber-400 font-mono">{action.roi} d/₹L</span>
                    </small>
                  </div>

                  <button
                    onClick={() => handleApplyRecovery(action)}
                    className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition-transform hover:-translate-y-0.5 ${
                      isBest
                        ? 'bg-gradient-to-r from-[#ffb020] to-[#ff4d4d] text-black shadow-md shadow-red-500/20'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Apply Action
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
