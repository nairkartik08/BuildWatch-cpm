export type DelayCause = 'delivery' | 'weather' | 'resource' | 'other';

export type TaskStatus = 'not_started' | 'in_progress' | 'completed';

export interface CrashOption {
  maxDays: number;
  costPerDay: number;
}

export interface ExpediteOption {
  maxDaysSaved: number;
  cost: number;
}

export interface Contractor {
  id: string;
  name: string;
  trade: string;
  reliability: number; // 0.7 (super fast) to 1.3 (flaky/slow)
}

export interface Delivery {
  id: string;
  material: string;
  supplier: string;
  expectedArrival: number; // day offset
  actualArrival?: number;
  expediteOption?: ExpediteOption;
}

export interface DelayEvent {
  id: string;
  taskId: string;
  days: number;
  cause: DelayCause;
  note?: string;
  createdAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  author: string;
  role: 'manager' | 'contractor';
  content: string;
  createdAt: string;
}

export interface Task {
  id: string;
  name: string;
  trade: string;
  site: string;
  contractorId?: string;
  assignedResource?: string;
  durationMin: number;
  durationLikely: number;
  durationMax: number;
  predecessors: string[]; // finish-to-start IDs
  outdoor: boolean;
  crashable?: CrashOption;
  percentComplete: number;
  actualStart?: number; // day offset
  actualFinish?: number; // day offset
  isDelivery?: boolean;
  deliveryId?: string;
}

export interface Project {
  name: string;
  startDate: string; // ISO date string e.g. "2026-10-01"
  targetFinish: number; // day offset target
  statusDay: number; // today's day offset
  location?: string;
  latitude?: number;
  longitude?: number;
}

export interface WeatherForecastDay {
  date: string;
  weatherCode: number;
  precipitationMm: number;
  precipitationProbability: number;
  maxWindKmh: number;
}

export interface WeatherDelaySuggestion {
  taskId: string;
  days: number;
  reason: string;
}

export interface CPMTaskResult {
  taskId: string;
  es: number; // Earliest Start
  ef: number; // Earliest Finish
  ls: number; // Latest Start
  lf: number; // Latest Finish
  float: number; // Float / Slack
  critical: boolean;
  nearCritical: boolean;
  effectiveDuration: number;
  status: TaskStatus;
}

export interface CPMProjectResult {
  tasks: Record<string, CPMTaskResult>;
  projectFinish: number;
  scheduleVariance: number; // projectFinish - targetFinish
  criticalPath: string[]; // Ordered or set of critical task IDs
}
