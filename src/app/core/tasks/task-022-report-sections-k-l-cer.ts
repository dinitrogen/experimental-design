import type { TaskDefinition } from '../models/task.model';

export const TASK_022: TaskDefinition = {
  id: 'task-022-report-sections-k-l-cer',
  title: 'Report Writing Practice: Sections K–L (Toy Car CER)',
  sectionInstructions: {
    'K. Analysis — Data Trend': `A team investigated how **ramp height** affects the **distance a toy car rolls** across a level floor after leaving the ramp. They released the same car from rest at the same starting point on the ramp, using the same ramp and floor. They tested each height seven times.

**Independent variable:** ramp height (cm). **Dependent variable:** distance rolled (cm).

**Hypothesis:** If ramp height increases, then the distance the car rolls will increase because a higher starting position gives the car more gravitational potential energy that can become motion.

### Summary statistics

| Ramp height (cm) | Mean (cm) | Minimum (cm) | Maximum (cm) | Q1 (cm) | Q3 (cm) | IQR (cm) |
|:--:|--:|--:|--:|--:|--:|--:|
| 10 | 45 | 42 | 48 | 43 | 47 | 4 |
| 20 | 92 | 86 | 98 | 88 | 96 | 8 |
| 30 | 139 | 128 | 170 | 130 | 140 | 10 |

For the outlier analysis, these are the individual distances in trial order:

| Ramp height (cm) | Trial distances (cm) |
|:--:|:--|
| 10 | 42, 43, 44, 45, 46, 47, 48 |
| 20 | 86, 88, 90, 92, 94, 96, 98 |
| 30 | 128, 130, 132, 135, 138, 140, 170 |

The line of best fit for the three mean distances is **y = 4.7x − 2**, where x is ramp height (cm) and y is mean distance rolled (cm).

Write a claim, evidence, and reasoning for each section below. A claim answers the question, evidence supplies numbers, and reasoning explains how the numbers support the claim. Use the [Report Sections Guide](/study-guides/report-sections-guide) and [CER Quick Reference Guide](/study-guides/cer-guide) if you need help.`,
    'K. Analysis — Outliers': `Use the **1.5 × IQR rule separately for each ramp height**. Lower bound = Q1 − 1.5 × IQR; upper bound = Q3 + 1.5 × IQR. Compare every trial distance with the bounds for its own ramp height. A value strictly below the lower bound or above the upper bound is an outlier; a value exactly on a bound is not.`,
    'L. Conclusion': `Return to the hypothesis in the experiment summary. Restate it, decide whether the results support it, and explain your decision using the means, line of best fit, and relevant science. Data can support a hypothesis but do not prove it.`,
  },
  prompts: [
    {
      sectionHeader: 'K. Analysis — Data Trend',
      label: 'Data Trend — Claim',
      type: 'text',
      subLabel:
        'Describe the relationship between ramp height and distance rolled. Is the correlation positive or negative?',
      textRows: 3,
    },
    {
      label: 'Data Trend — Evidence',
      type: 'text',
      subLabel: 'Cite the line of best fit and its slope. You may also cite the means with units.',
      textRows: 3,
    },
    {
      label: 'Data Trend — Reasoning',
      type: 'text',
      subLabel:
        'Explain what the sign of the slope says about how distance changes as ramp height increases, and connect that to your claim.',
      textRows: 3,
    },
    {
      sectionHeader: 'K. Analysis — Outliers',
      label: 'Outliers — Claim',
      type: 'text',
      subLabel: 'State how many outliers you found in the trial data.',
      textRows: 3,
    },
    {
      label: 'Outliers — Evidence',
      type: 'text',
      subLabel:
        'Show the lower and upper bounds for each ramp height, with units. Identify any trial values outside their bounds.',
      textRows: 4,
    },
    {
      label: 'Outliers — Reasoning',
      type: 'text',
      subLabel:
        'Compare any outlying value with its bound and explain why it is an outlier. Explain how the other trials compare with their bounds.',
      textRows: 4,
    },
    {
      sectionHeader: 'L. Conclusion',
      label: 'Conclusion — Hypothesis Restated',
      type: 'text',
      subLabel: 'Restate the original hypothesis, including its scientific reason.',
      textRows: 3,
    },
    {
      label: 'Conclusion — Claim',
      type: 'text',
      subLabel:
        'Was the hypothesis supported or not supported? State what happened to distance as ramp height increased.',
      textRows: 3,
    },
    {
      label: 'Conclusion — Evidence',
      type: 'text',
      subLabel: 'Cite the mean distance at each ramp height, with units, and the line of best fit.',
      textRows: 3,
    },
    {
      label: 'Conclusion — Reasoning',
      type: 'text',
      subLabel:
        'Explain how the means and slope support your decision about the hypothesis. Use the experiment’s science to explain why the observed relationship makes sense.',
      textRows: 4,
    },
  ],
  dueDate: '',
  createdAt: '2026-10-29',
};
