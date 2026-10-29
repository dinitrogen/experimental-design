import type { TaskDefinition } from '../models/task.model';

export const TASK_012: TaskDefinition = {
  id: 'task-012-cer-helicopter',
  archived: true,
  title: 'Full CER Practice: Paper Helicopter Experiment',
  promptFile: 'tasks/task-012-cer-helicopter.md',
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
  dueDate: '',
  createdAt: '2026-04-16',
};
