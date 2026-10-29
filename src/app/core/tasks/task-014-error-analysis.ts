import type { TaskDefinition } from '../models/task.model';

export const TASK_014: TaskDefinition = {
  id: 'task-014-error-analysis',
  archived: true,
  title: 'Error Analysis Practice',
  promptFile: 'tasks/task-014-error-analysis.md',
  prompts: [
    // ── Scenario 1: Candle Burn Time ──
    {
      label: 'Error 1 — Type',
      type: 'short-answer',
      sectionHeader: 'Scenario 1 — Candle Burn Time Under Different Jar Sizes',
      subLabel: 'Is this error systematic, procedural, or random?',
    },
    {
      label: 'Error 1 — Description',
      type: 'text',
      subLabel: 'Describe the specific error in the experiment.',
    },
    {
      label: 'Error 1 — Effect on Results',
      type: 'text',
      subLabel: 'How does this error specifically affect the data?',
    },
    {
      label: 'Error 2 — Type',
      type: 'short-answer',
      subLabel: 'Is this error systematic, procedural, or random?',
    },
    {
      label: 'Error 2 — Description',
      type: 'text',
      subLabel: 'Describe the specific error in the experiment.',
    },
    {
      label: 'Error 2 — Effect on Results',
      type: 'text',
      subLabel: 'How does this error specifically affect the data?',
    },
    // ── Scenario 2: Paper Airplane Distance ──
    {
      label: 'Error 1 — Type',
      type: 'short-answer',
      sectionHeader: 'Scenario 2 — Paper Airplane Distance by Number of Wing Folds',
      subLabel: 'Is this error systematic, procedural, or random?',
    },
    {
      label: 'Error 1 — Description',
      type: 'text',
      subLabel: 'Describe the specific error in the experiment.',
    },
    {
      label: 'Error 1 — Effect on Results',
      type: 'text',
      subLabel: 'How does this error specifically affect the data?',
    },
    {
      label: 'Error 2 — Type',
      type: 'short-answer',
      subLabel: 'Is this error systematic, procedural, or random?',
    },
    {
      label: 'Error 2 — Description',
      type: 'text',
      subLabel: 'Describe the specific error in the experiment.',
    },
    {
      label: 'Error 2 — Effect on Results',
      type: 'text',
      subLabel: 'How does this error specifically affect the data?',
    },
    // ── Scenario 3: Tea Steeping Color ──
    {
      label: 'Error 1 — Type',
      type: 'short-answer',
      sectionHeader: 'Scenario 3 — Tea Steeping Color Intensity',
      subLabel: 'Is this error systematic, procedural, or random?',
    },
    {
      label: 'Error 1 — Description',
      type: 'text',
      subLabel: 'Describe the specific error in the experiment.',
    },
    {
      label: 'Error 1 — Effect on Results',
      type: 'text',
      subLabel: 'How does this error specifically affect the data?',
    },
    {
      label: 'Error 2 — Type',
      type: 'short-answer',
      subLabel: 'Is this error systematic, procedural, or random?',
    },
    {
      label: 'Error 2 — Description',
      type: 'text',
      subLabel: 'Describe the specific error in the experiment.',
    },
    {
      label: 'Error 2 — Effect on Results',
      type: 'text',
      subLabel: 'How does this error specifically affect the data?',
    },
  ],
  dueDate: '',
  createdAt: '2026-04-16',
};
