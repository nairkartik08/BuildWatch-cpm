import React, { useState, useMemo } from 'react';
import type { Task, CPMProjectResult, Delivery, Contractor } from '../../engine/types';
import { offsetToDate } from '../../engine/dates';
import {
  Calendar,
  Layers,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface GanttChartProps {
  tasks: Task[];
  cpmResult: CPMProjectResult;
  deliveries: Delivery[];
  contractors: Contractor[];
  projectStartDate: string;
  statusDay: number;
  targetDeadline: number;
  selectedTaskId?: string | null;
  onSelectTask?: (id: string | null) => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  cpmResult,
  contractors,
  projectStartDate,
  statusDay,
  targetDeadline,
  selectedTaskId,
  onSelectTask,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(24); // pixels per day
  const [filterMode, setFilterMode] = useState<'all' | 'critical' | 'delivery'>('all');
  const [selectedTrade, setSelectedTrade] = useState<string>('all');
  const [showDependencies, setShowDependencies] = useState<boolean>(true);
  const [hoveredTask, setHoveredTask] = useState<{
    task: Task;
    x: number;
    y: number;
  } | null>(null);

  const contractorMap = useMemo(
    () => new Map(contractors.map((c) => [c.id, c])),
    [contractors]
  );

  const trades = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.trade))),
    [tasks]
  );

  // Filter tasks based on controls
  const visibleTasks = useMemo(() => {
    return tasks.filter((t) => {
      const cpm = cpmResult.tasks[t.id];
      if (!cpm) return false;

      if (filterMode === 'critical' && !cpm.critical) return false;
      if (filterMode === 'delivery' && !t.isDelivery) return false;
      if (selectedTrade !== 'all' && t.trade !== selectedTrade) return false;

      return true;
    });
  }, [tasks, cpmResult, filterMode, selectedTrade]);

  // Timeline bounds
  const totalDays = Math.max(cpmResult.projectFinish, targetDeadline, 65) + 10;
  const dayArray = useMemo(() => Array.from({ length: totalDays }, (_, i) => i), [totalDays]);

  const rowHeight = 36;
  const headerHeight = 52;
  const chartWidth = totalDays * zoomLevel;

  // Task Y-coordinate mapping for dependency arrow rendering
  const taskRowIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    visibleTasks.forEach((t, idx) => map.set(t.id, idx));
    return map;
  }, [visibleTasks]);

  return (
    <div className="flex flex-col h-full bg-[#0d121c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Control Toolbar */}
      <div className="p-3 px-4 bg-[#121823]/90 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#ffb020]" />
            Gantt Radar Timeline
          </span>
          <span className="text-[#8e9ab0]">({visibleTasks.length} tasks visible)</span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Trade Filter */}
          <div className="flex items-center gap-1.5 bg-[#0b0f16] border border-white/10 rounded-xl px-2.5 py-1">
            <Layers className="w-3.5 h-3.5 text-[#8e9ab0]" />
            <select
              value={selectedTrade}
              onChange={(e) => setSelectedTrade(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs"
            >
              <option value="all" className="bg-[#0b0f16]">All Trades</option>
              {trades.map((tr) => (
                <option key={tr} value={tr} className="bg-[#0b0f16]">{tr}</option>
              ))}
            </select>
          </div>

          {/* Mode Pill Buttons */}
          <div className="flex items-center bg-[#0b0f16] border border-white/10 rounded-xl p-0.5">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterMode === 'all'
                  ? 'bg-white/10 text-white font-bold'
                  : 'text-[#8e9ab0] hover:text-white'
              }`}
            >
              All Tasks
            </button>
            <button
              onClick={() => setFilterMode('critical')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterMode === 'critical'
                  ? 'bg-red-500/20 text-[#ff4d4d] border border-red-500/30 font-bold'
                  : 'text-[#8e9ab0] hover:text-white'
              }`}
            >
              Critical Only
            </button>
            <button
              onClick={() => setFilterMode('delivery')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterMode === 'delivery'
                  ? 'bg-blue-500/20 text-[#4da3ff] border border-blue-500/30 font-bold'
                  : 'text-[#8e9ab0] hover:text-white'
              }`}
            >
              Deliveries
            </button>
          </div>

          {/* Toggle Predecessor Links */}
          <button
            onClick={() => setShowDependencies(!showDependencies)}
            className={`px-2.5 py-1 rounded-xl border transition-all ${
              showDependencies
                ? 'bg-amber-500/10 text-[#ffb020] border-amber-500/30'
                : 'bg-[#0b0f16] text-[#8e9ab0] border-white/10'
            }`}
          >
            Links {showDependencies ? 'ON' : 'OFF'}
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-[#0b0f16] border border-white/10 rounded-xl p-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(16, z - 4))}
              className="p-1 hover:text-white text-[#8e9ab0]"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] px-1 font-mono text-slate-300">{zoomLevel}px</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(48, z + 4))}
              className="p-1 hover:text-white text-[#8e9ab0]"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Gantt Split Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Fixed Task Name & Trade Column */}
        <div className="w-64 md:w-72 bg-[#0d121c] border-r border-white/10 flex flex-col shrink-0 z-20 shadow-xl">
          {/* Table Header */}
          <div
            className="border-b border-white/10 px-4 flex items-center justify-between text-[#8e9ab0] uppercase font-bold text-[10px] tracking-wider shrink-0 bg-[#121823]"
            style={{ height: headerHeight }}
          >
            <span>Task Name / Phase</span>
            <span>Trade</span>
          </div>

          {/* Task rows */}
          <div className="overflow-y-auto flex-1 divide-y divide-white/5">
            {visibleTasks.map((task) => {
              const res = cpmResult.tasks[task.id];
              const isSelected = selectedTaskId === task.id;

              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTask?.(isSelected ? null : task.id)}
                  style={{ height: rowHeight }}
                  className={`px-4 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#ffb020]/20 text-white'
                      : 'hover:bg-white/[0.03] text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    {res?.critical && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d4d] shrink-0" />
                    )}
                    <span className="truncate text-xs font-medium">
                      {task.name.replace('📦 Material Arrival: ', '📦 ')}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8e9ab0] font-mono shrink-0">
                    {task.trade.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Scrollable Timeline Grid */}
        <div className="flex-1 overflow-auto relative">
          <div style={{ width: chartWidth, minHeight: '100%' }} className="relative bg-[#0b0f16]">
            {/* Timeline Header (Days & Dates) */}
            <div
              className="sticky top-0 bg-[#121823] border-b border-white/10 z-10 flex divide-x divide-white/5"
              style={{ height: headerHeight }}
            >
              {dayArray.map((day) => {
                const isStatusDay = day === statusDay;
                const isTargetDeadline = day === targetDeadline;

                return (
                  <div
                    key={day}
                    style={{ width: zoomLevel }}
                    className={`shrink-0 flex flex-col items-center justify-center text-[10px] ${
                      isStatusDay
                        ? 'bg-blue-500/15 text-blue-400 font-bold'
                        : isTargetDeadline
                        ? 'bg-red-500/15 text-red-400 font-bold'
                        : 'text-[#8e9ab0]'
                    }`}
                  >
                    <span>d{day}</span>
                    <span className="text-[9px] text-slate-500">
                      {offsetToDate(projectStartDate, day, 'd')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Vertical Marker: Today / Status Day */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none border-l-2 border-[#4da3ff] z-20"
              style={{ left: statusDay * zoomLevel + zoomLevel / 2 }}
            >
              <div className="sticky top-1 ml-1 px-1.5 py-0.5 rounded bg-[#4da3ff] text-black text-[9px] font-bold shadow-md">
                Today (Day {statusDay})
              </div>
            </div>

            {/* Vertical Marker: Target Deadline */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none border-l-2 border-dashed border-[#ff4d4d] z-20"
              style={{ left: targetDeadline * zoomLevel + zoomLevel / 2 }}
            >
              <div className="sticky top-1 ml-1 px-1.5 py-0.5 rounded bg-[#ff4d4d] text-white text-[9px] font-bold shadow-md">
                Target Deadline (Day {targetDeadline})
              </div>
            </div>

            {/* Dependency Connecting SVG Lines */}
            {showDependencies && (
              <svg
                className="absolute inset-0 pointer-events-none z-10"
                style={{ width: chartWidth, height: visibleTasks.length * rowHeight }}
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 6 3, 0 6" fill="rgba(255, 176, 32, 0.6)" />
                  </marker>
                </defs>
                {visibleTasks.map((task) => {
                  const targetRow = taskRowIndexMap.get(task.id);
                  if (targetRow === undefined) return null;

                  const targetRes = cpmResult.tasks[task.id];
                  if (!targetRes) return null;

                  const targetX = targetRes.es * zoomLevel;
                  const targetY = targetRow * rowHeight + rowHeight / 2;

                  return task.predecessors.map((predId) => {
                    const predRow = taskRowIndexMap.get(predId);
                    if (predRow === undefined) return null;

                    const predRes = cpmResult.tasks[predId];
                    if (!predRes) return null;

                    const predX = predRes.ef * zoomLevel;
                    const predY = predRow * rowHeight + rowHeight / 2;

                    const midX = predX + Math.max(10, (targetX - predX) / 2);

                    return (
                      <path
                        key={`${predId}->${task.id}`}
                        d={`M ${predX} ${predY} L ${midX} ${predY} L ${midX} ${targetY} L ${targetX} ${targetY}`}
                        fill="none"
                        stroke="rgba(255, 176, 32, 0.4)"
                        strokeWidth="1.5"
                        strokeDasharray={targetRes.critical && predRes.critical ? 'none' : '3 3'}
                        markerEnd="url(#arrowhead)"
                      />
                    );
                  });
                })}
              </svg>
            )}

            {/* Task Bar Rows */}
            <div className="divide-y divide-white/5 relative z-10">
              {visibleTasks.map((task) => {
                const res = cpmResult.tasks[task.id];
                if (!res) return null;

                const isSelected = selectedTaskId === task.id;
                const left = res.es * zoomLevel;
                const durationDays = Math.max(0.8, res.ef - res.es);
                const width = durationDays * zoomLevel;

                // Color code
                let barColor = 'bg-[#35d07f]';
                if (res.critical) barColor = 'bg-[#ff4d4d]';
                else if (res.nearCritical) barColor = 'bg-[#ffb020]';
                else if (task.isDelivery) barColor = 'bg-[#4da3ff]';

                return (
                  <div
                    key={task.id}
                    style={{ height: rowHeight }}
                    className="relative flex items-center"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredTask({
                        task,
                        x: rect.left + left,
                        y: rect.top,
                      });
                    }}
                    onMouseLeave={() => setHoveredTask(null)}
                  >
                    {/* Free float indicator line (slack) */}
                    {res.float > 0 && !res.critical && (
                      <div
                        className="absolute h-1 bg-white/10 rounded-full border-t border-b border-dashed border-white/20 pointer-events-none"
                        style={{
                          left: left + width,
                          width: res.float * zoomLevel,
                          top: '50%',
                          transform: 'translateY(-50%)',
                        }}
                      />
                    )}

                    {/* Active CPM Bar */}
                    <div
                      onClick={() => onSelectTask?.(isSelected ? null : task.id)}
                      style={{
                        left,
                        width,
                        height: 20,
                      }}
                      className={`absolute rounded-md cursor-pointer transition-all duration-300 flex items-center justify-between px-2 text-[10px] font-bold text-black shadow-md ${barColor} ${
                        isSelected
                          ? 'ring-2 ring-white shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                          : 'hover:brightness-110'
                      }`}
                    >
                      {/* Percent complete fill overlay */}
                      {task.percentComplete > 0 && (
                        <div
                          className="absolute inset-0 bg-black/25 rounded-md pointer-events-none overflow-hidden"
                          style={{ width: `${task.percentComplete}%` }}
                        />
                      )}

                      <span className="relative z-10 truncate text-[9px] drop-shadow-sm font-semibold">
                        {task.isDelivery ? 'Milestone' : `${task.name}`}
                      </span>

                      {/* Float / Critical badge */}
                      <span className="relative z-10 font-mono text-[9px] ml-1 opacity-90">
                        {res.critical ? '0d' : `+${res.float}f`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Detailed Tooltip */}
      {hoveredTask && (
        <div className="absolute bottom-4 right-4 z-40 bg-[#121926]/95 border border-white/15 rounded-xl p-3 shadow-2xl backdrop-blur-md max-w-sm pointer-events-none animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2">
            <span className="font-bold text-white text-xs truncate">
              {hoveredTask.task.name}
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                cpmResult.tasks[hoveredTask.task.id]?.critical
                  ? 'bg-red-500/20 text-[#ff4d4d] border border-red-500/30'
                  : 'bg-emerald-500/20 text-[#35d07f] border border-emerald-500/30'
              }`}
            >
              {cpmResult.tasks[hoveredTask.task.id]?.critical ? 'CRITICAL' : 'BUFFERED'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-[#8e9ab0]">
            <div>
              <span>Trade: </span>
              <strong className="text-white">{hoveredTask.task.trade}</strong>
            </div>
            <div>
              <span>Contractor: </span>
              <strong className="text-white">
                {hoveredTask.task.contractorId
                  ? contractorMap.get(hoveredTask.task.contractorId)?.name || 'Assigned'
                  : 'In-house'}
              </strong>
            </div>
            <div>
              <span>Location: </span>
              <strong className="text-white">{hoveredTask.task.site}</strong>
            </div>
            <div>
              <span>Progress: </span>
              <strong className="text-blue-400 font-mono">
                {hoveredTask.task.percentComplete}%
              </strong>
            </div>
            <div>
              <span>Earliest (ES → EF): </span>
              <strong className="text-white font-mono">
                Day {cpmResult.tasks[hoveredTask.task.id]?.es} →{' '}
                {cpmResult.tasks[hoveredTask.task.id]?.ef}
              </strong>
            </div>
            <div>
              <span>Latest (LS → LF): </span>
              <strong className="text-white font-mono">
                Day {cpmResult.tasks[hoveredTask.task.id]?.ls} →{' '}
                {cpmResult.tasks[hoveredTask.task.id]?.lf}
              </strong>
            </div>
            <div className="col-span-2">
              <span>Total Float / Slack: </span>
              <strong className="text-amber-400 font-mono">
                {cpmResult.tasks[hoveredTask.task.id]?.float} Days
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
