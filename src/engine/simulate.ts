import type { Task, DelayEvent, Delivery, DelayCause } from './types';
import { calculateCPM } from './cpm';

export interface DelaySimulationPreview {
  taskId: string;
  injectedDays: number;
  cause: DelayCause;
  baselineFinish: number;
  simulatedFinish: number;
  netProjectSlip: number;
  floatRemaining: number;
  absorbedByFloat: boolean;
  switchedCriticalPath: boolean;
  newCriticalPathCount: number;
}

/**
 * Pure simulation function to preview what happens IF a delay is added to a task.
 * Returns the exact difference in project finish date and whether the critical path switches.
 */
export function previewDelayImpact(params: {
  tasks: Task[];
  delays: DelayEvent[];
  deliveries?: Delivery[];
  taskId: string;
  delayDays: number;
  cause: DelayCause;
  statusDay?: number;
  targetFinish?: number;
}): DelaySimulationPreview {
  const {
    tasks,
    delays,
    deliveries = [],
    taskId,
    delayDays,
    cause,
    statusDay = 0,
    targetFinish = 0,
  } = params;

  // 1. Baseline CPM calculation
  const baseline = calculateCPM({
    tasks,
    delays,
    deliveries,
    statusDay,
    targetFinish,
  });

  const baseTaskRes = baseline.tasks[taskId];
  const baselineFinish = baseline.projectFinish;

  // 2. Simulated CPM calculation with hypothetical delay
  const hypotheticalDelay: DelayEvent = {
    id: 'hypothetical-preview',
    taskId,
    days: Math.max(0, delayDays),
    cause,
    createdAt: new Date().toISOString(),
  };

  const simulated = calculateCPM({
    tasks,
    delays: [...delays, hypotheticalDelay],
    deliveries,
    statusDay,
    targetFinish,
  });

  const simTaskRes = simulated.tasks[taskId];
  const simulatedFinish = simulated.projectFinish;
  const netProjectSlip = Math.max(0, Math.round((simulatedFinish - baselineFinish) * 10) / 10);

  const baselineCritSet = new Set(baseline.criticalPath);
  const switchedCriticalPath = simulated.criticalPath.some((id) => !baselineCritSet.has(id));

  return {
    taskId,
    injectedDays: delayDays,
    cause,
    baselineFinish,
    simulatedFinish,
    netProjectSlip,
    floatRemaining: simTaskRes ? simTaskRes.float : 0,
    absorbedByFloat: netProjectSlip === 0 && (baseTaskRes?.float ?? 0) >= delayDays,
    switchedCriticalPath,
    newCriticalPathCount: simulated.criticalPath.length,
  };
}
