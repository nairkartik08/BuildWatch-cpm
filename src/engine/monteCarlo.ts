import type { Task, DelayEvent, Contractor } from './types';
import { calculateCPM } from './cpm';

export interface MonteCarloResult {
  runs: number;
  finishDates: number[]; // Sorted finish dates
  probOnTime: number;    // Probability finish <= targetFinish (0.0 to 1.0)
  p50: number;
  p80: number;
  p90: number;
  criticalityIndex: Record<string, number>; // TaskId -> probability of being critical (0.0 to 1.0)
}

/**
 * Seeded 32-bit PRNG (mulberry32) for deterministic, fast Monte Carlo sampling
 */
export function createMulberry32(seed = 123456): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Triangular distribution sample generator with contractor reliability adjustment
 * a = min, c = likely, b = max adjusted by contractor reliability
 */
function sampleTriangular(
  min: number,
  likely: number,
  max: number,
  reliability = 1.0,
  rng: () => number
): number {
  const a = min;
  const c = likely;
  // Flaky contractors widen the upper limit
  const b = c + Math.max(0, max - c) * reliability;

  if (b <= a) return c;

  const u = rng();
  const fc = (c - a) / (b - a);

  if (u < fc) {
    return a + Math.sqrt(u * (b - a) * (c - a));
  } else {
    return b - Math.sqrt((1 - u) * (b - a) * (b - c));
  }
}

/**
 * Runs Monte Carlo schedule simulation
 */
export function runMonteCarlo(params: {
  tasks: Task[];
  delays?: DelayEvent[];
  contractors?: Contractor[];
  targetFinish: number;
  statusDay?: number;
  iterations?: number;
  seed?: number;
}): MonteCarloResult {
  const {
    tasks,
    delays = [],
    contractors = [],
    targetFinish,
    statusDay = 0,
    iterations = 600,
    seed = 42,
  } = params;

  if (tasks.length === 0) {
    return {
      runs: 0,
      finishDates: [],
      probOnTime: 0,
      p50: 0,
      p80: 0,
      p90: 0,
      criticalityIndex: {},
    };
  }

  const rng = createMulberry32(seed);
  const contractorMap = new Map(contractors.map((c) => [c.id, c.reliability]));
  const finishDates: number[] = [];
  const criticalCounts: Record<string, number> = {};

  for (const t of tasks) {
    criticalCounts[t.id] = 0;
  }

  // Pre-calculate active delay offsets per task
  const delayMap = new Map<string, number>();
  for (const d of delays) {
    delayMap.set(d.taskId, (delayMap.get(d.taskId) || 0) + d.days);
  }

  for (let run = 0; run < iterations; run++) {
    // Generate sampled tasks
    const sampledTasks: Task[] = tasks.map((t) => {
      // Deliveries are arrival milestones
      if (t.isDelivery) {
        return t;
      }

      // If finished, duration is fixed
      if (t.percentComplete >= 100) {
        return t;
      }

      const rel = t.contractorId ? contractorMap.get(t.contractorId) ?? 1.0 : 1.0;
      const sampledDuration = sampleTriangular(
        t.durationMin,
        t.durationLikely,
        t.durationMax,
        rel,
        rng
      );

      // Remaining work fraction for in-progress tasks
      const remainingFrac = t.percentComplete > 0 ? (1 - t.percentComplete / 100) : 1;
      const effectiveSampled = Math.max(0.5, Math.round((sampledDuration * remainingFrac) * 10) / 10);

      return {
        ...t,
        durationLikely: effectiveSampled,
      };
    });

    // Run pure CPM on sampled schedules
    const cpmResult = calculateCPM({
      tasks: sampledTasks,
      delays,
      statusDay,
      targetFinish,
    });

    finishDates.push(cpmResult.projectFinish);

    for (const critId of cpmResult.criticalPath) {
      criticalCounts[critId] = (criticalCounts[critId] || 0) + 1;
    }
  }

  // Sort finish dates to extract percentiles
  finishDates.sort((a, b) => a - b);

  const onTimeCount = finishDates.filter((f) => f <= targetFinish).length;
  const probOnTime = Math.round((onTimeCount / iterations) * 100) / 100;

  const p50 = finishDates[Math.floor(iterations * 0.5)];
  const p80 = finishDates[Math.floor(iterations * 0.8)];
  const p90 = finishDates[Math.floor(iterations * 0.9)];

  const criticalityIndex: Record<string, number> = {};
  for (const [id, count] of Object.entries(criticalCounts)) {
    criticalityIndex[id] = Math.round((count / iterations) * 100) / 100;
  }

  return {
    runs: iterations,
    finishDates,
    probOnTime,
    p50,
    p80,
    p90,
    criticalityIndex,
  };
}
