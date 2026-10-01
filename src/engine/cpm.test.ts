import { describe, it, expect } from 'vitest';
import { calculateCPM, topologicalSort, ScheduleCycleError } from './cpm';
import { initialTasks, initialDeliveries, initialProject } from '../data/seedProject';
import type { Task, DelayEvent } from './types';

describe('CPM Engine Tests', () => {
  it('should correctly calculate forward and backward pass on a linear chain A -> B -> C', () => {
    const tasks: Task[] = [
      {
        id: 'A',
        name: 'Task A',
        trade: 'General',
        site: 'Site 1',
        durationMin: 3,
        durationLikely: 3,
        durationMax: 3,
        predecessors: [],
        outdoor: false,
        percentComplete: 0,
      },
      {
        id: 'B',
        name: 'Task B',
        trade: 'General',
        site: 'Site 1',
        durationMin: 4,
        durationLikely: 4,
        durationMax: 4,
        predecessors: ['A'],
        outdoor: false,
        percentComplete: 0,
      },
      {
        id: 'C',
        name: 'Task C',
        trade: 'General',
        site: 'Site 1',
        durationMin: 2,
        durationLikely: 2,
        durationMax: 2,
        predecessors: ['B'],
        outdoor: false,
        percentComplete: 0,
      },
    ];

    const result = calculateCPM({ tasks, targetFinish: 9 });

    expect(result.projectFinish).toBe(9);
    expect(result.scheduleVariance).toBe(0);

    // All should have 0 float and be critical
    expect(result.tasks['A'].es).toBe(0);
    expect(result.tasks['A'].ef).toBe(3);
    expect(result.tasks['A'].float).toBe(0);
    expect(result.tasks['A'].critical).toBe(true);

    expect(result.tasks['B'].es).toBe(3);
    expect(result.tasks['B'].ef).toBe(7);
    expect(result.tasks['B'].float).toBe(0);
    expect(result.tasks['B'].critical).toBe(true);

    expect(result.tasks['C'].es).toBe(7);
    expect(result.tasks['C'].ef).toBe(9);
    expect(result.tasks['C'].float).toBe(0);
    expect(result.tasks['C'].critical).toBe(true);
  });

  it('should calculate float on a diamond dependency graph with parallel paths', () => {
    // Start (A: 2d)
    // Branch 1: B (5d)
    // Branch 2: C (2d) -> float should be 3d
    // Finish (D: 3d) predecessors [B, C]
    const tasks: Task[] = [
      {
        id: 'A',
        name: 'Start',
        trade: 'Trade',
        site: 'Site',
        durationMin: 2,
        durationLikely: 2,
        durationMax: 2,
        predecessors: [],
        outdoor: false,
        percentComplete: 0,
      },
      {
        id: 'B',
        name: 'Long Branch',
        trade: 'Trade',
        site: 'Site',
        durationMin: 5,
        durationLikely: 5,
        durationMax: 5,
        predecessors: ['A'],
        outdoor: false,
        percentComplete: 0,
      },
      {
        id: 'C',
        name: 'Short Branch',
        trade: 'Trade',
        site: 'Site',
        durationMin: 2,
        durationLikely: 2,
        durationMax: 2,
        predecessors: ['A'],
        outdoor: false,
        percentComplete: 0,
      },
      {
        id: 'D',
        name: 'Join Task',
        trade: 'Trade',
        site: 'Site',
        durationMin: 3,
        durationLikely: 3,
        durationMax: 3,
        predecessors: ['B', 'C'],
        outdoor: false,
        percentComplete: 0,
      },
    ];

    const result = calculateCPM({ tasks, targetFinish: 10 });

    expect(result.projectFinish).toBe(10); // 2 + 5 + 3 = 10
    expect(result.tasks['B'].float).toBe(0);
    expect(result.tasks['B'].critical).toBe(true);

    // Short branch has 3 days of float (LS = 5, ES = 2)
    expect(result.tasks['C'].es).toBe(2);
    expect(result.tasks['C'].ef).toBe(4);
    expect(result.tasks['C'].ls).toBe(5);
    expect(result.tasks['C'].lf).toBe(7);
    expect(result.tasks['C'].float).toBe(3);
    expect(result.tasks['C'].critical).toBe(false);
  });

  it('should detect circular dependencies and throw ScheduleCycleError', () => {
    const cyclicTasks: Task[] = [
      {
        id: 'X',
        name: 'Task X',
        trade: 'General',
        site: 'Site',
        durationMin: 1,
        durationLikely: 1,
        durationMax: 1,
        predecessors: ['Z'],
        outdoor: false,
        percentComplete: 0,
      },
      {
        id: 'Y',
        name: 'Task Y',
        trade: 'General',
        site: 'Site',
        durationMin: 1,
        durationLikely: 1,
        durationMax: 1,
        predecessors: ['X'],
        outdoor: false,
        percentComplete: 0,
      },
      {
        id: 'Z',
        name: 'Task Z',
        trade: 'General',
        site: 'Site',
        durationMin: 1,
        durationLikely: 1,
        durationMax: 1,
        predecessors: ['Y'],
        outdoor: false,
        percentComplete: 0,
      },
    ];

    expect(() => topologicalSort(cyclicTasks)).toThrow(ScheduleCycleError);
  });

  it('should flip the critical path when an initially non-critical branch receives a delay', () => {
    const tasks: Task[] = [
      {
        id: 'Start',
        name: 'Start',
        trade: 'General',
        site: 'Site',
        durationMin: 1,
        durationLikely: 1,
        durationMax: 1,
        predecessors: [],
        outdoor: false,
        percentComplete: 0,
      },
      {
        id: 'BranchA',
        name: 'Path A',
        trade: 'General',
        site: 'Site',
        durationMin: 6,
        durationLikely: 6,
        durationMax: 6,
        predecessors: ['Start'],
        outdoor: false,
        percentComplete: 0,
      },
      {
        id: 'BranchB',
        name: 'Path B',
        trade: 'General',
        site: 'Site',
        durationMin: 4,
        durationLikely: 4,
        durationMax: 4,
        predecessors: ['Start'],
        outdoor: false,
        percentComplete: 0,
      },
      {
        id: 'End',
        name: 'End',
        trade: 'General',
        site: 'Site',
        durationMin: 2,
        durationLikely: 2,
        durationMax: 2,
        predecessors: ['BranchA', 'BranchB'],
        outdoor: false,
        percentComplete: 0,
      },
    ];

    // Baseline: BranchA is critical (1 + 6 + 2 = 9)
    const baseline = calculateCPM({ tasks, targetFinish: 9 });
    expect(baseline.tasks['BranchA'].critical).toBe(true);
    expect(baseline.tasks['BranchB'].critical).toBe(false);
    expect(baseline.tasks['BranchB'].float).toBe(2);

    // Delay BranchB by 5 days: Path B becomes 1 + (4+5) + 2 = 12, flipping the critical path!
    const delays: DelayEvent[] = [
      {
        id: 'delay-1',
        taskId: 'BranchB',
        days: 5,
        cause: 'weather',
        createdAt: '2026-10-01',
      },
    ];

    const delayed = calculateCPM({ tasks, delays, targetFinish: 9 });
    expect(delayed.projectFinish).toBe(12);
    expect(delayed.tasks['BranchB'].critical).toBe(true);
    expect(delayed.tasks['BranchA'].critical).toBe(false);
    expect(delayed.tasks['BranchA'].float).toBe(3);
  });

  it('should run CPM successfully on the complete Apex Hospital seed project', () => {
    const result = calculateCPM({
      tasks: initialTasks,
      deliveries: initialDeliveries,
      targetFinish: initialProject.targetFinish,
      statusDay: initialProject.statusDay,
    });

    expect(result.projectFinish).toBeGreaterThan(50);
    expect(result.criticalPath.length).toBeGreaterThan(0);
    expect(result.tasks['t-raft-foundation']).toBeDefined();
  });
});
