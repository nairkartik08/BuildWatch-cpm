import type { Task, DelayEvent, CPMProjectResult, CPMTaskResult, TaskStatus, Delivery } from './types';

export class ScheduleCycleError extends Error {
  readonly cycleNodeIds: string[];

  constructor(cycleNodeIds: string[]) {
    super(`Circular dependency detected involving tasks: [${cycleNodeIds.join(' -> ')}]`);
    this.name = 'ScheduleCycleError';
    this.cycleNodeIds = cycleNodeIds;
  }
}

/**
 * Calculates effective task duration taking into account:
 * - Completed tasks: actual duration (actualFinish - actualStart)
 * - In progress: elapsed (statusDay - actualStart) + remaining work
 * - Not started: durationLikely + sum of delays
 */
export function calculateEffectiveDuration(
  task: Task,
  statusDay: number,
  taskDelays: DelayEvent[]
): { duration: number; status: TaskStatus } {
  const delaySum = taskDelays
    .filter((d) => d.taskId === task.id)
    .reduce((sum, d) => sum + d.days, 0);

  // Delivery tasks are milestone arrival points (duration 0)
  if (task.isDelivery) {
    return { duration: 0, status: task.percentComplete >= 100 ? 'completed' : 'not_started' };
  }

  // 1. Completed
  if (task.percentComplete >= 100 || (task.actualFinish !== undefined && task.actualFinish <= statusDay)) {
    const start = task.actualStart ?? 0;
    const finish = task.actualFinish ?? (start + task.durationLikely);
    return {
      duration: Math.max(0, finish - start),
      status: 'completed',
    };
  }

  // 2. In progress
  if (task.percentComplete > 0 || (task.actualStart !== undefined && task.actualStart <= statusDay)) {
    const start = task.actualStart ?? statusDay;
    const elapsed = Math.max(0, statusDay - start);
    const remainingFraction = Math.max(0, 1 - task.percentComplete / 100);
    const remainingWork = task.durationLikely * remainingFraction + delaySum;
    const totalDuration = elapsed + remainingWork;
    return {
      duration: Math.max(0.5, Math.round(totalDuration * 10) / 10),
      status: 'in_progress',
    };
  }

  // 3. Not started
  const plannedDuration = Math.max(0, task.durationLikely + delaySum);
  return {
    duration: Math.round(plannedDuration * 10) / 10,
    status: 'not_started',
  };
}

/**
 * Performs Kahn's algorithm for topological sorting and detects cycles.
 */
export function topologicalSort(tasks: Task[]): Task[] {
  const taskMap = new Map<string, Task>();
  const inDegree = new Map<string, number>();
  const successors = new Map<string, string[]>();

  for (const task of tasks) {
    taskMap.set(task.id, task);
    inDegree.set(task.id, 0);
    successors.set(task.id, []);
  }

  for (const task of tasks) {
    for (const predId of task.predecessors) {
      if (taskMap.has(predId)) {
        inDegree.set(task.id, (inDegree.get(task.id) || 0) + 1);
        successors.get(predId)!.push(task.id);
      }
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) {
      queue.push(id);
    }
  }

  const sorted: Task[] = [];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    sorted.push(taskMap.get(currentId)!);

    for (const succId of successors.get(currentId) || []) {
      const newDeg = (inDegree.get(succId) || 1) - 1;
      inDegree.set(succId, newDeg);
      if (newDeg === 0) {
        queue.push(succId);
      }
    }
  }

  if (sorted.length !== tasks.length) {
    // Collect remaining tasks with inDegree > 0 to identify the cycle
    const cycleTasks = tasks.filter((t) => (inDegree.get(t.id) || 0) > 0).map((t) => t.id);
    throw new ScheduleCycleError(cycleTasks);
  }

  return sorted;
}

/**
 * Computes CPM (Forward pass, Backward pass, Float, Critical Path, Schedule Variance).
 */
export function calculateCPM(params: {
  tasks: Task[];
  delays?: DelayEvent[];
  deliveries?: Delivery[];
  statusDay?: number;
  targetFinish?: number;
}): CPMProjectResult {
  const { tasks, delays = [], deliveries = [], statusDay = 0, targetFinish = 0 } = params;

  if (tasks.length === 0) {
    return {
      tasks: {},
      projectFinish: 0,
      scheduleVariance: 0,
      criticalPath: [],
    };
  }

  // 1. Sort topologically (throws ScheduleCycleError if cyclic)
  const sortedTasks = topologicalSort(tasks);
  const deliveryMap = new Map<string, Delivery>(deliveries.map((d) => [d.id, d]));

  // Track successors for backward pass
  const successors = new Map<string, string[]>();
  for (const task of tasks) {
    successors.set(task.id, []);
  }
  for (const task of tasks) {
    for (const predId of task.predecessors) {
      if (successors.has(predId)) {
        successors.get(predId)!.push(task.id);
      }
    }
  }

  // Effective durations & statuses
  const effectiveDurations = new Map<string, number>();
  const taskStatuses = new Map<string, TaskStatus>();

  for (const task of tasks) {
    const { duration, status } = calculateEffectiveDuration(task, statusDay, delays);
    effectiveDurations.set(task.id, duration);
    taskStatuses.set(task.id, status);
  }

  // 2. Forward Pass: Earliest Start (ES) and Earliest Finish (EF)
  const esMap = new Map<string, number>();
  const efMap = new Map<string, number>();

  for (const task of sortedTasks) {
    let es = 0;

    // A delivery task's earliest start is constrained by expected arrival day + any delivery delays
    if (task.isDelivery && task.deliveryId) {
      const del = deliveryMap.get(task.deliveryId);
      const deliveryDelay = delays
        .filter((d) => d.taskId === task.id)
        .reduce((sum, d) => sum + d.days, 0);
      const arrival = (del?.actualArrival ?? del?.expectedArrival ?? 0) + deliveryDelay;
      es = Math.max(es, arrival);
    }

    // Actual start constraints
    if (task.actualStart !== undefined) {
      es = Math.max(es, task.actualStart);
    }

    // Predecessor constraints (Finish-to-Start)
    for (const predId of task.predecessors) {
      if (efMap.has(predId)) {
        es = Math.max(es, efMap.get(predId)!);
      }
    }

    const duration = effectiveDurations.get(task.id) || 0;
    const ef = es + duration;

    esMap.set(task.id, Math.round(es * 10) / 10);
    efMap.set(task.id, Math.round(ef * 10) / 10);
  }

  // Calculate project finish as max EF across all tasks
  let projectFinish = 0;
  for (const ef of efMap.values()) {
    if (ef > projectFinish) {
      projectFinish = ef;
    }
  }
  projectFinish = Math.round(projectFinish * 10) / 10;

  // 3. Backward Pass: Latest Finish (LF) and Latest Start (LS)
  // Critical-path float is measured against the calculated project completion,
  // never against a later contractual deadline. The deadline is used separately
  // for variance, otherwise a healthy buffer would incorrectly make every task non-critical.
  const baselineFinish = projectFinish;
  const lfMap = new Map<string, number>();
  const lsMap = new Map<string, number>();

  // Reverse topological order
  for (let i = sortedTasks.length - 1; i >= 0; i--) {
    const task = sortedTasks[i];
    const taskSuccessors = successors.get(task.id) || [];

    let lf = baselineFinish;
    if (taskSuccessors.length > 0) {
      lf = Math.min(...taskSuccessors.map((succId) => lsMap.get(succId) ?? baselineFinish));
    }

    const duration = effectiveDurations.get(task.id) || 0;
    const ls = lf - duration;

    lfMap.set(task.id, Math.round(lf * 10) / 10);
    lsMap.set(task.id, Math.round(ls * 10) / 10);
  }

  // 4. Float and Criticality Determination
  const taskResults: Record<string, CPMTaskResult> = {};
  const criticalTasks: string[] = [];

  for (const task of tasks) {
    const es = esMap.get(task.id) ?? 0;
    const ef = efMap.get(task.id) ?? 0;
    const ls = lsMap.get(task.id) ?? 0;
    const lf = lfMap.get(task.id) ?? 0;
    const float = Math.round((ls - es) * 10) / 10;

    // Critical: float <= 0 (or float <= 0.05 to guard against rounding)
    const isCritical = float <= 0.05;
    // Near critical: 0 < float <= 2
    const isNearCritical = !isCritical && float <= 2.05;

    if (isCritical) {
      criticalTasks.push(task.id);
    }

    taskResults[task.id] = {
      taskId: task.id,
      es,
      ef,
      ls,
      lf,
      float,
      critical: isCritical,
      nearCritical: isNearCritical,
      effectiveDuration: effectiveDurations.get(task.id) ?? 0,
      status: taskStatuses.get(task.id) ?? 'not_started',
    };
  }

  const scheduleVariance = Math.round((projectFinish - targetFinish) * 10) / 10;

  return {
    tasks: taskResults,
    projectFinish,
    scheduleVariance,
    criticalPath: criticalTasks,
  };
}
