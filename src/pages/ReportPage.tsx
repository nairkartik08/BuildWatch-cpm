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
  Printer,
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
    <div className="max-w-5xl mx-auto space-y-5 pb-16 font-sans">
      {/* Top Header & Share Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141c2b] border border-[#232f44] p-4 px-5 rounded-md shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Executive Schedule & Delay Risk Report
            </h2>
            <p className="text-xs text-slate-400">
              Audit Status Date: {offsetToDate(project.startDate, project.statusDay)} (Day {project.statusDay})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded text-xs font-semibold bg-[#0f172a] text-slate-300 border border-[#232f44] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 rounded text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Link Copied!' : 'Copy Shareable Link'}</span>
          </button>
        </div>
      </div>

      {/* Printable / Viewable Report Body */}
      <div className="bg-[#141c2b] border border-[#232f44] rounded-md p-6 sm:p-8 space-y-8 shadow-sm">
        {/* Project Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#232f44] pb-6 gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              PROJECT SCHEDULE AUDIT · PHASE 1
            </span>
            <h1 className="text-2xl font-black text-white mt-1.5">{project.name}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Start Date: {offsetToDate(project.startDate, 0)} · Target Target Completion: Day {project.targetFinish} (
              {offsetToDate(project.startDate, project.targetFinish)})
            </p>
          </div>

          <div className="text-right">
            <span
              className={`text-xs font-bold px-3 py-1 rounded border ${
                isLate
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}
            >
              {isLate ? 'SCHEDULE OVERRUN RISK' : 'SCHEDULE ON TRACK'}
            </span>
          </div>
        </div>

        {/* Executive Summary Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded bg-[#0f172a] border border-[#232f44]">
            <span className="text-xs text-slate-400 block mb-1">Projected Completion</span>
            <b
              className={`text-2xl font-extrabold tracking-tight font-mono ${
                isLate ? 'text-red-400' : 'text-white'
              }`}
            >
              Day {cpm.projectFinish}
            </b>
            <span className="text-[11px] text-slate-400 block mt-1">
              {offsetToDate(project.startDate, cpm.projectFinish)}
            </span>
          </div>

          <div className="p-4 rounded bg-[#0f172a] border border-[#232f44]">
            <span className="text-xs text-slate-400 block mb-1">Schedule Variance</span>
            <b
              className={`text-2xl font-extrabold tracking-tight font-mono ${
                isLate ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {isLate ? `+${cpm.scheduleVariance}d` : `${cpm.scheduleVariance}d`}
            </b>
            <span className="text-[11px] text-slate-400 block mt-1">
              {isLate ? 'Behind target deadline' : 'Ahead of deadline'}
            </span>
          </div>

          <div className="p-4 rounded bg-[#0f172a] border border-[#232f44]">
            <span className="text-xs text-slate-400 block mb-1">On-Time Probability</span>
            <b
              className={`text-2xl font-extrabold tracking-tight font-mono ${
                confPercent >= 75
                  ? 'text-emerald-400'
                  : confPercent >= 50
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}
            >
              {confPercent}%
            </b>
            <span className="text-[11px] text-slate-400 block mt-1">Monte Carlo (600 runs)</span>
          </div>

          <div className="p-4 rounded bg-[#0f172a] border border-[#232f44]">
            <span className="text-xs text-slate-400 block mb-1">Critical Path Tasks</span>
            <b className="text-2xl font-extrabold text-red-400 tracking-tight font-mono">
              {cpm.criticalPath.length}
            </b>
            <span className="text-[11px] text-slate-400 block mt-1">Zero-float tasks</span>
          </div>
        </div>

        {/* Critical Path Tasks Table */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Critical Path Sequence (Zero Float Buffer)
          </h3>
          <div className="border border-[#232f44] rounded overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0f172a] text-slate-400 uppercase text-[10px] font-bold border-b border-[#232f44]">
                <tr>
                  <th className="py-2.5 px-4">Task Name</th>
                  <th className="py-2.5 px-3">Trade</th>
                  <th className="py-2.5 px-3">Earliest Dates</th>
                  <th className="py-2.5 px-3 text-center">Planned Duration</th>
                  <th className="py-2.5 px-3 text-right">Float Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232f44]">
                {cpm.criticalPath.map((id) => {
                  const t = tasks.find((task) => task.id === id);
                  const res = cpm.tasks[id];
                  if (!t || !res) return null;

                  return (
                    <tr key={id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-semibold text-white">
                        {t.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{t.trade}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        Day {res.es} → Day {res.ef}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                        {t.durationLikely}d
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">
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
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Recommended Recovery Actions
          </h3>
          {recoveryOptions.length === 0 ? (
            <div className="p-4 rounded bg-[#0f172a] text-xs text-slate-400 text-center border border-[#232f44]">
              No active recovery required: schedule is optimal.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recoveryOptions.slice(0, 4).map((rec, idx) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded border border-[#232f44] bg-[#0f172a] flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {idx === 0 && '⭐ '}
                      {rec.title}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {rec.kind} · Recovers <strong className="text-white font-mono">{rec.daysSaved} days</strong> · Cost: ₹
                      {rec.costInLakhs.toFixed(2)}L
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
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
