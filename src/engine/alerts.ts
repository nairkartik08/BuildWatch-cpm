import type { Task, DelayEvent, CPMProjectResult, Delivery } from './types';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface ScheduleAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  taskId?: string;
  category: 'delivery' | 'critical_path' | 'float' | 'deadline';
  timestamp: string;
}

/**
 * Pure function evaluating project schedule state to generate alerts
 */
export function generateScheduleAlerts(params: {
  tasks: Task[];
  delays: DelayEvent[];
  deliveries: Delivery[];
  cpmResult: CPMProjectResult;
  targetFinish: number;
}): ScheduleAlert[] {
  const { tasks, delays, deliveries, cpmResult, targetFinish } = params;
  const alerts: ScheduleAlert[] = [];

  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  // 1. Deadline breach alert
  if (cpmResult.projectFinish > targetFinish) {
    const slip = Math.round((cpmResult.projectFinish - targetFinish) * 10) / 10;
    alerts.push({
      id: 'al-deadline-breach',
      severity: 'critical',
      title: 'Target Deadline Breach',
      message: `Projected finish is Day ${cpmResult.projectFinish} (+${slip}d past target deadline Day ${targetFinish}).`,
      category: 'deadline',
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Late deliveries alerts
  for (const del of deliveries) {
    const task = tasks.find((t) => t.deliveryId === del.id);
    if (!task) continue;

    const taskDelays = delays.filter((d) => d.taskId === task.id);
    const totalSlip = taskDelays.reduce((sum, d) => sum + d.days, 0);

    if (totalSlip > 0) {
      const isCritical = cpmResult.tasks[task.id]?.critical;
      alerts.push({
        id: `al-del-${del.id}`,
        severity: isCritical ? 'critical' : 'warning',
        title: isCritical ? 'Critical Delivery Delay' : 'Material Delivery Slipped',
        message: `${del.material} from ${del.supplier} is ${totalSlip}d late.${
          isCritical ? ' Threatens critical path directly!' : ''
        }`,
        taskId: task.id,
        category: 'delivery',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // 3. Low float warnings (float <= 2 days)
  for (const [taskId, res] of Object.entries(cpmResult.tasks)) {
    const task = taskMap.get(taskId);
    if (!task || task.isDelivery) continue;

    if (res.nearCritical && res.float > 0) {
      alerts.push({
        id: `al-near-crit-${taskId}`,
        severity: 'warning',
        title: 'Buffer Float Low',
        message: `"${task.name}" has only ${res.float}d of float left before becoming critical.`,
        taskId,
        category: 'float',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // 4. Critical path summary
  if (cpmResult.criticalPath.length > 0) {
    alerts.push({
      id: 'al-crit-summary',
      severity: 'info',
      title: 'Active Critical Path',
      message: `${cpmResult.criticalPath.length} tasks currently operate with zero float.`,
      category: 'critical_path',
      timestamp: new Date().toISOString(),
    });
  }

  return alerts;
}
