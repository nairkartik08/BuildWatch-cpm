import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Project, Task, Delivery, Contractor, DelayEvent, TaskComment } from '../engine/types';
import {
  initialProject,
  initialTasks,
  initialDeliveries,
  initialContractors,
  initialDelays,
  initialComments,
} from '../data/seedProject';

interface ProjectState {
  project: Project;
  tasks: Task[];
  deliveries: Delivery[];
  contractors: Contractor[];
  delays: DelayEvent[];
  comments: TaskComment[];
  selectedTaskId: string | null;
  currentUserRole: 'manager' | 'contractor';

  // Task actions
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  // Delay actions
  addDelay: (delay: Omit<DelayEvent, 'id' | 'createdAt'>) => void;
  removeDelay: (id: string) => void;

  // Delivery actions
  updateDelivery: (id: string, updates: Partial<Delivery>) => void;

  // Comment actions
  addComment: (comment: Omit<TaskComment, 'id' | 'createdAt'>) => void;

  // Selection & UI actions
  setSelectedTaskId: (id: string | null) => void;
  setUserRole: (role: 'manager' | 'contractor') => void;

  // Demo helpers
  injectSteelDelayDemo: () => void;
  resetDemo: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      project: initialProject,
      tasks: initialTasks,
      deliveries: initialDeliveries,
      contractors: initialContractors,
      delays: initialDelays,
      comments: initialComments,
      selectedTaskId: null,
      currentUserRole: 'manager',

      addTask: (newTask) =>
        set((state) => ({
          tasks: [...state.tasks, newTask],
        })),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks
            .filter((t) => t.id !== id)
            .map((t) => ({
              ...t,
              predecessors: t.predecessors.filter((p) => p !== id),
            })),
          delays: state.delays.filter((d) => d.taskId !== id),
          selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
        })),

      addDelay: (delayData) => {
        const id = `del-${Date.now()}`;
        const newDelay: DelayEvent = {
          ...delayData,
          id,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          delays: [...state.delays, newDelay],
        }));
      },

      removeDelay: (id) =>
        set((state) => ({
          delays: state.delays.filter((d) => d.id !== id),
        })),

      updateDelivery: (id, updates) =>
        set((state) => {
          const nextDeliveries = state.deliveries.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          );

          // Synchronize delivery milestone task if expectedArrival changed
          const nextTasks = state.tasks.map((t) => {
            if (t.deliveryId === id && updates.expectedArrival !== undefined) {
              return {
                ...t,
                // delivery task earliest day follows arrival
              };
            }
            return t;
          });

          return {
            deliveries: nextDeliveries,
            tasks: nextTasks,
          };
        }),

      addComment: (commentData) => {
        const id = `cm-${Date.now()}`;
        const newComment: TaskComment = {
          ...commentData,
          id,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          comments: [...state.comments, newComment],
        }));
      },

      setSelectedTaskId: (id) => set({ selectedTaskId: id }),
      setUserRole: (role) => set({ currentUserRole: role }),

      // Scripted demo shortcut: injects 6-day steel delivery slip
      injectSteelDelayDemo: () =>
        set((state) => {
          const exists = state.delays.find((d) => d.taskId === 'task-del-steel');
          if (exists) return state; // Already injected

          const demoDelay: DelayEvent = {
            id: 'delay-steel-demo',
            taskId: 'task-del-steel',
            days: 6,
            cause: 'delivery',
            note: 'Structural steel delivery vessel delayed at sea',
            createdAt: new Date().toISOString(),
          };

          return {
            delays: [...state.delays, demoDelay],
          };
        }),

      resetDemo: () =>
        set({
          project: initialProject,
          tasks: initialTasks,
          deliveries: initialDeliveries,
          contractors: initialContractors,
          delays: initialDelays,
          comments: initialComments,
          selectedTaskId: null,
          currentUserRole: 'manager',
        }),
    }),
    {
      name: 'critical-path-radar-state-v1',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
