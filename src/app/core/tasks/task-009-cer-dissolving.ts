import type { TaskDefinition } from '../models/task.model';

export const TASK_009: TaskDefinition = {
  id: 'task-009-cer-dissolving',
  archived: true,
  title: 'Full CER Practice: Sugar Dissolving Experiment',
  promptFile: 'tasks/task-009-cer-dissolving.md',
  prompts: [
    // ── Data Trend CER ──
    {
      label: 'Claim',
      type: 'text',
      sectionHeader: 'Data Trend CER',
    },
    {
      label: 'Evidence',
      type: 'text',
    },
    {
      label: 'Reasoning',
      type: 'text',
    },
    // ── Variation CER ──
    {
      label: 'Claim',
      type: 'text',
      sectionHeader: 'Variation CER',
    },
    {
      label: 'Evidence',
      type: 'text',
    },
    {
      label: 'Reasoning',
      type: 'text',
    },
    // ── Outliers CER ──
    {
      label: 'Claim',
      type: 'text',
      sectionHeader: 'Outliers CER',
    },
    {
      label: 'Evidence',
      type: 'text',
    },
    {
      label: 'Reasoning',
      type: 'text',
    },
    // ── Conclusion CER ──
    {
      label: 'Hypothesis (Restated)',
      type: 'text',
      sectionHeader: 'Conclusion CER',
    },
    {
      label: 'Claim',
      type: 'text',
    },
    {
      label: 'Evidence',
      type: 'text',
    },
    {
      label: 'Reasoning',
      type: 'text',
    },
  ],
  dueDate: '2026-04-27',
  createdAt: '2026-04-13',
};
