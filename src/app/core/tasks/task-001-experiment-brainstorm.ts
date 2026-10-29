import type { TaskDefinition } from '../models/task.model';

export const TASK_001: TaskDefinition = {
  id: 'task-001-experiment-brainstorm',
  archived: true,
  title: 'Experiment Design Challenge',
  promptFile: 'tasks/task-001-experiment-brainstorm.md',
  prompts: [
    {
      label: 'Prompt 1 — Velocity',
      type: 'text',
      subLabel: 'Include your statement of problem, hypothesis, IV, DV, and procedure',
    },
    {
      label: 'Prompt 2 — Reaction Time',
      type: 'text',
      subLabel: 'Include your statement of problem, hypothesis, IV, DV, and procedure',
    },
  ],
  dueDate: '2026-03-25',
  createdAt: '2026-03-18',
};
