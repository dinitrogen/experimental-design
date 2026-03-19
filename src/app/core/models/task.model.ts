import { Timestamp } from '@angular/fire/firestore';

export type PromptType = 'text' | 'number' | 'short-answer' | 'table';

export interface TaskPrompt {
  /** Label shown above the input */
  label: string;
  type: PromptType;
  /** Optional hint shown below the input */
  hint?: string;
  /** For 'number': expected answer for auto-check */
  expectedAnswer?: number;
  /** For 'number': acceptable tolerance (default 0.01) */
  tolerance?: number;
  /** For 'table': column headers */
  columns?: string[];
  /** For 'table': number of data rows */
  rows?: number;
  /** For 'table': expected cell values (row-major) for auto-check. null = no check for that cell */
  expectedTableValues?: (string | null)[][];
  /** For 'table': pre-filled read-only cells (row-major). null = editable blank */
  prefilled?: (string | null)[][];
}

export interface TaskDefinition {
  id: string;
  title: string;
  /** Relative path to the markdown prompt file in public/ */
  promptFile: string;
  /** Ordered list of prompts/inputs the student must complete */
  prompts: TaskPrompt[];
  dueDate: string; // ISO date string, e.g. '2026-03-20'
  createdAt: string; // ISO date string
}

export interface TaskSubmission {
  id?: string;
  taskId: string;
  studentUid: string;
  studentDisplayName?: string;
  status: 'not-started' | 'in-progress' | 'submitted' | 'reviewed';
  /** One entry per prompt. For 'table' prompts, the value is a JSON-stringified 2D array. */
  responses: string[];
  coachFeedback: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  submittedAt: Timestamp | null;
  reviewedAt: Timestamp | null;
}

/**
 * Static task registry. New tasks are added here.
 * Tasks are ordered newest-first for display.
 */
export const TASK_DEFINITIONS: TaskDefinition[] = [
  {
    id: 'task-001-experiment-brainstorm',
    title: 'Experiment Design Challenge',
    promptFile: 'tasks/task-001-experiment-brainstorm.md',
    prompts: [
      { label: 'Prompt 1 — Velocity', type: 'text', hint: 'Include your statement of problem, hypothesis, IV, DV, and procedure' },
      { label: 'Prompt 2 — Reaction Time', type: 'text', hint: 'Include your statement of problem, hypothesis, IV, DV, and procedure' },
    ],
    dueDate: '2026-03-25',
    createdAt: '2026-03-18',
  },
];

export function getTaskDefinition(taskId: string): TaskDefinition | undefined {
  return TASK_DEFINITIONS.find((t) => t.id === taskId);
}
