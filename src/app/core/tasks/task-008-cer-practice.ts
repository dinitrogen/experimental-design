import type { TaskDefinition } from '../models/task.model';

export const TASK_008: TaskDefinition = {
  id: 'task-008-cer-practice',
  archived: true,
  title: 'Full CER Practice: Bounce Height Experiment',
  promptFile: 'tasks/task-008-cer-practice.md',
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
  dueDate: '2026-04-20',
  createdAt: '2026-04-05',
};
