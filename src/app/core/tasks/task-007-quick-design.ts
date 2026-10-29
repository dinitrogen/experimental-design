import type { TaskDefinition } from '../models/task.model';

export const TASK_007: TaskDefinition = {
  id: 'task-007-quick-design',
  archived: true,
  title: 'Quick Design Challenge',
  promptFile: 'tasks/task-007-quick-design.md',
  prompts: [
    // ── Topic 1: Elasticity ──
    {
      label: 'Statement of Problem',
      type: 'text',
      sectionHeader: 'Topic 1 — Elasticity',
      subLabel: 'Write a testable question about elasticity using the provided materials.',
    },
    {
      label: 'Independent Variable',
      type: 'short-answer',
      subLabel: 'What would you change between trials?',
    },
    {
      label: 'Dependent Variable',
      type: 'short-answer',
      subLabel: 'What would you measure?',
    },
    // ── Topic 2: Capillary Action ──
    {
      label: 'Statement of Problem',
      type: 'text',
      sectionHeader: 'Topic 2 — Capillary Action',
      subLabel: 'Write a testable question about capillary action using the provided materials.',
    },
    {
      label: 'Independent Variable',
      type: 'short-answer',
      subLabel: 'What would you change between trials?',
    },
    {
      label: 'Dependent Variable',
      type: 'short-answer',
      subLabel: 'What would you measure?',
    },
    // ── Topic 3: Magnetism ──
    {
      label: 'Statement of Problem',
      type: 'text',
      sectionHeader: 'Topic 3 — Magnetism',
      subLabel: 'Write a testable question about magnetism using the provided materials.',
    },
    {
      label: 'Independent Variable',
      type: 'short-answer',
      subLabel: 'What would you change between trials?',
    },
    {
      label: 'Dependent Variable',
      type: 'short-answer',
      subLabel: 'What would you measure?',
    },
  ],
  dueDate: '2026-04-13',
  createdAt: '2026-04-01',
};
