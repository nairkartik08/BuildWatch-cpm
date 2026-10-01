import type { Task, DelayEvent } from './types';
import { calculateCPM } from './cpm';

export interface DownstreamSlipImpact {
  taskId: string;
  originalEf: number;
  newEf: number;
  slipDays: number;
}

export interface BlastRadiusResult {
  sourceTaskId: string;
  injectedDays: number;
  affectedTasks: Record<string, DownstreamSlipImpact>;
  affectedCount: number;
  projectSlipDays: number;
  originalProjectFinish: number;
  newProjectFinish: number;
  switchedCriticalPath: boolean;
  newCriticalPath: string[];
}

/**
 * Calculates blast radius when a specific task is delayed by `injectedDays`.
 * Identifies every downstream task whose EF is delayed and detects critical path flips.
 */
export function calculateBlastRadius(params: {
  tasks: Task[];
  delays: DelayEvent[];
  sourceTaskId: string;
  injectedDays?: number;
  statusDay?: number;
  targetFinish?: number;
}): BlastRadiusResult {
  const {
    tasks,
    delays,
    sourceTaskId,
    injectedDays = 5,
    statusDay = 0,
    targetFinish = 0,
  } = params;

  // 1. Baseline CPM calculation
  const baseline = calculateCPM({
    tasks,
    delays,
    statusDay,
    targetFinish,
  });

  // 2. Injected CPM calculation
  const simulatedDelay: DelayEvent = {
    id: `sim-blast-${Date.now()}`,
    taskId: sourceTaskId,
    days: injectedDays,
    cause: 'other',
    createdAt: new Date().toISOString(),
  };

  const simulated = calculateCPM({
    tasks,
    delays: [...delays, simulatedDelay],
    statusDay,
    targetFinish,
  });

  // 3. Compare each task's EF
  const affectedTasks: Record<string, DownstreamSlipImpact> = {};
  for (const task of tasks) {
    if (task.id === sourceTaskId) continue;
    const baseEf = baseline.tasks[task.id]?.ef ?? 0;
    const simEf = simulated.tasks[task.id]?.ef ?? 0;
    const diff = Math.round((simEf - baseEf) * 10) / 10;
    if (diff > 0.05) {
      affectedTasks[task.id] = {
        taskId: task.id,
        originalEf: baseEf,
        newEf: simEf,
        slipDays: diff,
      };
    }
  }

  const projectSlipDays = Math.max(0, Math.round((simulated.projectFinish - baseline.projectFinish) * 10) / 10);
  const baselineCritSet = new Set(baseline.criticalPath);
  const hasSwitched = simulated.criticalPath.some((id) => !baselineCritSet.has(id));

  return {
    sourceTaskId,
    injectedDays,
    affectedTasks,
    affectedCount: Object.keys(affectedTasks).length,
    projectSlipDays,
    originalProjectFinish: baseline.projectFinish,
    newProjectFinish: simulated.projectFinish,
    switchedCriticalPath: hasSwitched,
    newCriticalPath: simulated.criticalPath,
  };
}
