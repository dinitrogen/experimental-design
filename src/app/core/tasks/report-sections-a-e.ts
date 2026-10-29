import type { TaskDefinition, TaskPrompt } from '../models/task.model';

/** Shared response boxes for the "Report Writing Practice: Sections A–E" task versions. */
const REPORT_SECTIONS_A_E_PROMPTS: TaskPrompt[] = [
  {
    sectionHeader: 'A. Statement of the Problem',
    label: 'Statement of the Problem',
    type: 'text',
    subLabel:
      'Write one question that names your IV and DV with units. It must not be a yes/no question.',
  },
  {
    sectionHeader: 'B. Hypothesis',
    label: 'Hypothesis',
    type: 'text',
    subLabel: 'If [IV] increases, then [DV] will [increase/decrease], because [scientific reason].',
  },
  {
    sectionHeader: 'C. Variables',
    label: 'Independent Variable (IV)',
    type: 'text',
    subLabel:
      'Operationally define it: what you change, how you change it, the tool used, and the units.',
  },
  {
    label: 'Levels of the IV',
    type: 'text',
    subLabel: 'List at least 3 levels, with units.',
  },
  {
    label: 'Dependent Variable (DV)',
    type: 'text',
    subLabel:
      'Operationally define it: what you measure, when and how you measure it, the tool used, and the units.',
  },
  {
    label: 'Controlled Variables (CV)',
    type: 'text',
    subLabel:
      'List 3 controlled variables and describe how each one is kept the same. Do not include the IV or DV.',
  },
  {
    sectionHeader: 'D. Materials',
    label: 'Materials',
    type: 'text',
    subLabel:
      'List every item you use with its quantity. Include measuring tools. Do not list items you do not use.',
  },
  {
    sectionHeader: 'E. Procedure and Set-Up Diagrams',
    label: 'Procedure',
    type: 'text',
    subLabel:
      'Write a numbered list of steps, including repeated trials and clean-up. Then draw at least 2 labeled diagrams of your set-up (such as a side view and a top view) on a separate sheet, labeling the materials, IV levels, tools, and where each team member stands.',
  },
];

export const TASK_019: TaskDefinition = {
  id: 'task-019-report-sections-a-e-buoyancy',
  title: 'Report Writing Practice: Sections A–E (Buoyancy)',
  promptFile: 'tasks/task-019-report-sections-a-e-buoyancy.md',
  prompts: REPORT_SECTIONS_A_E_PROMPTS,
  dueDate: '',
  createdAt: '2026-10-15',
};

export const TASK_018: TaskDefinition = {
  id: 'task-018-report-sections-a-e-pendulum',
  title: 'Report Writing Practice: Sections A–E (Pendulum)',
  promptFile: 'tasks/task-018-report-sections-a-e-pendulum.md',
  prompts: REPORT_SECTIONS_A_E_PROMPTS,
  dueDate: '',
  createdAt: '2026-10-15',
};

export const TASK_017: TaskDefinition = {
  id: 'task-017-report-sections-a-e',
  title: 'Report Writing Practice: Sections A–E (Friction)',
  promptFile: 'tasks/task-017-report-sections-a-e.md',
  prompts: REPORT_SECTIONS_A_E_PROMPTS,
  dueDate: '',
  createdAt: '2026-10-15',
};
