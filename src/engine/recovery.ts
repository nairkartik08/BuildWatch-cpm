import type { Task, DelayEvent, Delivery } from './types';
import { calculateCPM } from './cpm';

export interface RecoveryAction {
  id: string;
  taskId: string;
  title: string;
  kind: 'Expedite' | 'Crash';
  daysSaved: number;
  costInLakhs: number;
  roi: number; // days saved per lakh
  applied: boolean;
}

/**
 * Computes candidate recovery actions (expediting deliveries or crashing crashable tasks),
 * re-runs CPM on each to calculate true net schedule days saved, and ranks them by ROI.
 */
export function calculateRecoveryOptions(params: {
  tasks: Task[];
  delays: DelayEvent[];
  deliveries: Delivery[];
  statusDay?: number;
  targetFinish?: number;
}): RecoveryAction[] {
  const { tasks, delays, deliveries, statusDay = 0, targetFinish = 0 } = params;

  const baseline = calculateCPM({ tasks, delays, deliveries, statusDay, targetFinish });
  const actions: RecoveryAction[] = [];

  // 1. Delivery Expedite candidates (if delivery has delay or delay exists)
  for (const del of deliveries) {
    const task = tasks.find((t) => t.deliveryId === del.id);
    if (!task) continue;

    const taskDelays = delays.filter((d) => d.taskId === task.id);
    const totalDelay = taskDelays.reduce((sum, d) => sum + d.days, 0);

    if (totalDelay > 0 && del.expediteOption) {
      const daysToSave = Math.min(del.expediteOption.maxDaysSaved, totalDelay);
      const costInLakhs = Math.round((del.expediteOption.cost / 100000) * 100) / 100;

      // Simulate schedule with expedite applied (reduce delays by daysToSave)
      const simulatedDelays = delays.map((d) =>
        d.taskId === task.id ? { ...d, days: Math.max(0, d.days - daysToSave) } : d
      );

      const simCPM = calculateCPM({
        tasks,
        delays: simulatedDelays,
        deliveries,
        statusDay,
        targetFinish,
      });

      const netSaved = Math.max(0, Math.round((baseline.projectFinish - simCPM.projectFinish) * 10) / 10);

      actions.push({
        id: `expedite-${del.id}`,
        taskId: task.id,
        title: `Expedite ${del.material.split('(')[0].trim()}`,
        kind: 'Expedite',
        daysSaved: netSaved,
        costInLakhs,
        roi: Math.round((netSaved / Math.max(costInLakhs, 0.1)) * 10) / 10,
        applied: false,
      });
    }
  }

  // 2. Crashable task candidates
  for (const task of tasks) {
    if (!task.isDelivery && task.crashable && task.percentComplete < 100) {
      const crashDays = task.crashable.maxDays;
      const costInLakhs = Math.round(((task.crashable.costPerDay * crashDays) / 100000) * 100) / 100;

      // Simulate task duration compressed
      const simTasks = tasks.map((t) =>
        t.id === task.id ? { ...t, durationLikely: Math.max(1, t.durationLikely - crashDays) } : t
      );

      const simCPM = calculateCPM({
        tasks: simTasks,
        delays,
        deliveries,
        statusDay,
        targetFinish,
      });

      const netSaved = Math.max(0, Math.round((baseline.projectFinish - simCPM.projectFinish) * 10) / 10);

      actions.push({
        id: `crash-${task.id}`,
        taskId: task.id,
        title: `Add crew: ${task.name}`,
        kind: 'Crash',
        daysSaved: netSaved,
        costInLakhs,
        roi: Math.round((netSaved / Math.max(costInLakhs, 0.1)) * 10) / 10,
        applied: false,
      });
    }
  }

  // Filter to actions that actually save schedule time and rank descending by ROI & days saved
  return actions
    .filter((a) => a.daysSaved > 0)
    .sort((a, b) => b.roi - a.roi || b.daysSaved - a.daysSaved);
}
