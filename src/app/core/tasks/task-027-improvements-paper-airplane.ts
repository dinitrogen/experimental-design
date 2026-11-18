import type { TaskDefinition, TaskPrompt } from '../models/task.model';

function numbered(label: string, count: number, header: string, subLabel: string): TaskPrompt[] {
  return Array.from({ length: count }, (_, i) => ({
    label: `${label} ${i + 1}`,
    type: 'text' as const,
    ...(i === 0 ? { sectionHeader: header, subLabel } : {}),
  }));
}

export const TASK_027: TaskDefinition = {
  id: 'task-027-improvements-paper-airplane',
  title: 'Improvements, Applications & Future Experiments: Paper Airplane Wing Shape',
  promptFile: 'tasks/task-027-improvements-paper-airplane.md',
  prompts: [
    ...numbered(
      'Improvement',
      3,
      'Improvements',
      'Give 3 specific changes that would make this experiment more accurate or reliable.',
    ),
    ...numbered(
      'Application',
      2,
      'Applications',
      'Give 2 real-world uses of these findings.',
    ),
    ...numbered(
      'Future Experiment',
      3,
      'Future Experiments',
      'Give 3 follow-up experiments (a new IV, a different DV, or a design variation).',
    ),
  ],
  dueDate: '',
  createdAt: '2026-11-18',
};
