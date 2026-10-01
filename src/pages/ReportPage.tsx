import React, { useMemo, useState } from 'react';
import { useProjectStore } from '../store';
import { calculateCPM, runMonteCarlo, calculateRecoveryOptions } from '../engine';
import { offsetToDate } from '../engine/dates';
import LZString from 'lz-string';
import {
  FileText,
  Share2,
  Check,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';

export const ReportPage: React.FC = () => {
  const { tasks, delays, deliveries, contractors, project } = useProjectStore();
  const [copied, setCopied] = useState(false);

  // Full live computations for the executive report
  const cpm = useMemo(() => {
    return calculateCPM({
      tasks,
      delays,
      deliveries,
      statusDay: project.statusDay,
      targetFinish: project.targetFinish,
    });
  }, [tasks, delays, deliveries, project.statusDay, project.targetFinish]);

  const monteCarlo = useMemo(() => {
    return runMonteCarlo({
      tasks,
      delays,
      contractors,
      targetFinish: project.targetFinish,
      statusDay: project.statusDay,
      iterations: 600,
    });
  }, [tasks, delays, contractors, project.targetFinish, project.statusDay]);

  const recoveryOptions = useMemo(() => {
    return calculateRecoveryOptions({
      tasks,
      delays,
      deliveries,
      statusDay: project.statusDay,
      targetFinish: project.targetFinish,
    });
  }, [tasks, delays, deliveries, project.statusDay, project.targetFinish]);

  // Generate compressed self-contained shareable URL
  const shareableUrl = useMemo(() => {
    const snapshot = {
      project,
      tasksCount: tasks.length,
      delaysCount: delays.length,
      projectFinish: cpm.projectFinish,
      variance: cpm.scheduleVariance,
      confidence: Math.round(monteCarlo.probOnTime * 100),
      criticalCount: cpm.criticalPath.length,
      generatedAt: new Date().toISOString(),
    };
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(snapshot));
    return `${window.location.origin}/app/report#snapshot=${compressed}`;
  }, [project, tasks.length, delays.length, cpm, monteCarlo.probOnTime]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isLate = cpm.scheduleVariance > 0;
  const confPercent = Math.round(monteCarlo.probOnTime * 100);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Header & Share Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121926] border border-white/10 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#ffb020] to-[#ff4d4d] text-black">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Executive Construction Delay & Risk Audit
            </h2>
            <p className="text-xs text-[#8e9ab0]">
              Snapshot timestamp: {offsetToDate(project.startDate, project.statusDay)} (Day {project.statusDay})
            </p>
          </div>
        </div>

        <button
          onClick={handleCopyLink}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#ffb020] text-black hover:bg-amber-400 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition-all cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Shareable Report Link'}</span>
        </button>
      </div>

      {/* Printable / Viewable Report Body */}
      <div className="bg-[#121926] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-8 shadow-2xl">
        {/* Project Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-6 gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#ffb020] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              AUDIT REPORT · APEX HOSPITAL EXPANSION
            </span>
            <h1 className="text-2xl font-black text-white mt-1">{project.name}</h1>
            <p className="text-xs text-[#8e9ab0] mt-1">
              Start: {offsetToDate(project.startDate, 0)} · Target Handover: Day {project.targetFinish} (
              {offsetToDate(project.startDate, project.targetFinish)})
            </p>
          </div>

          <div className="text-right">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${
                isLate
                  ? 'bg-red-500/20 text-[#ff4d4d] border-red-500/30'
                  : 'bg-emerald-500/20 text-[#35d07f] border-emerald-500/30'
              }`}
            >
              {isLate ? 'SCHEDULE OVERRUN RISK' : 'SCHEDULE HEALTHY'}
            </span>
          </div>
        </div>

        {/* Executive Summary Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-xs text-[#8e9ab0] block mb-1">Projected Finish</span>
            <b
              className={`text-2xl font-extrabold tracking-tight ${
                isLate ? 'text-[#ff4d4d]' : 'text-white'
              }`}
            >
              Day {cpm.projectFinish}
            </b>
            <span className="text-[11px] text-[#8e9ab0] block mt-1">
              {offsetToDate(project.startDate, cpm.projectFinish)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-xs text-[#8e9ab0] block mb-1">Schedule Variance</span>
            <b
              className={`text-2xl font-extrabold tracking-tight ${
                isLate ? 'text-[#ff4d4d]' : 'text-[#35d07f]'
              }`}
            >
              {isLate ? `+${cpm.scheduleVariance}d` : `${cpm.scheduleVariance}d`}
            </b>
            <span className="text-[11px] text-[#8e9ab0] block mt-1">
              {isLate ? 'Over target deadline' : 'Buffer remaining'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-xs text-[#8e9ab0] block mb-1">On-Time Confidence</span>
            <b
              className={`text-2xl font-extrabold tracking-tight ${
                confPercent >= 75
                  ? 'text-[#35d07f]'
                  : confPercent >= 50
                  ? 'text-[#ffb020]'
                  : 'text-[#ff4d4d]'
              }`}
            >
              {confPercent}%
            </b>
            <span className="text-[11px] text-[#8e9ab0] block mt-1">600 simulations</span>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-xs text-[#8e9ab0] block mb-1">Critical Zero-Float Tasks</span>
            <b className="text-2xl font-extrabold text-[#ff4d4d] tracking-tight">
              {cpm.criticalPath.length}
            </b>
            <span className="text-[11px] text-[#8e9ab0] block mt-1">Directly threat deadline</span>
          </div>
        </div>

        {/* Critical Path Tasks Table */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#ff4d4d]" />
            Active Critical Path Sequence (Zero Float Buffer)
          </h3>
          <div className="border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-[#8e9ab0] uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-4">Task Name</th>
                  <th className="py-2.5 px-3">Trade</th>
                  <th className="py-2.5 px-3">Earliest Dates</th>
                  <th className="py-2.5 px-3 text-center">Duration</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {cpm.criticalPath.map((id) => {
                  const t = tasks.find((task) => task.id === id);
                  const res = cpm.tasks[id];
                  if (!t || !res) return null;

                  return (
                    <tr key={id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-4 font-semibold text-white">
                        {t.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{t.trade}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        Day {res.es} → Day {res.ef}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                        {t.durationLikely}d
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-[#ff4d4d] border border-red-500/30">
                          Critical (0d float)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommended Recovery Actions */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#35d07f]" />
            Recommended Recovery Interventions
          </h3>
          {recoveryOptions.length === 0 ? (
            <div className="p-4 rounded-xl bg-white/5 text-xs text-[#8e9ab0] text-center">
              No active recovery required: project is on track or critical path is already compressed.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recoveryOptions.slice(0, 4).map((rec, idx) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {idx === 0 && '⭐ '}
                      {rec.title}
                    </span>
                    <span className="text-[11px] text-[#8e9ab0] block mt-0.5">
                      {rec.kind} · Recovers <strong className="text-white">{rec.daysSaved} days</strong> · Cost: ₹
                      {rec.costInLakhs.toFixed(2)}L
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                    {rec.roi} d/₹L
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
