import type { TaskDefinition } from '../models/task.model';

export const TASK_020: TaskDefinition = {
  id: 'task-020-report-sections-g-i',
  title: 'Report Writing Practice: Sections G–I (Toy Car Ramp)',
  sectionInstructions: {
    'G. Quantitative Data': `A toy car was released from a ramp at different heights. The team measured how far it rolled across the floor after leaving the ramp.

**Independent variable:** ramp height (cm). **Dependent variable:** distance rolled (cm). The team tested three ramp heights, with five trials at each height.

Notebook measurements (in trial order):

| Ramp height (cm) | Trial 1 | Trial 2 | Trial 3 | Trial 4 | Trial 5 |
|:--:|--:|--:|--:|--:|--:|
| 10 | 45 | 42 | 48 | 45 | 50 |
| 20 | 92 | 88 | 95 | 92 | 93 |
| 30 | 135 | 130 | 138 | 142 | 135 |

Fill in the column-heading fields directly in both tables. Use clear labels with units. The raw table should contain every measurement; the condensed table should contain only the means you will graph. Show one sample mean calculation.`,
    'H. Graph': `Make a scatter plot of the mean distance for each ramp height from your condensed table. Give the graph a descriptive title, label both axes with units, and add the three data points. Draw a single line of best fit (do not connect the points). Click the graph to place points, or focus it and use the arrow keys plus Enter. Hold Shift with an arrow key for a larger step. Switch to line mode and add two endpoints to draw the best-fit line.`,
    'I. Statistics — Sample Calculation at 30 cm': `Calculate the statistics for the 30 cm ramp height using these five distances: **135, 130, 138, 142, 135 cm**. Mean, median, mode, minimum, maximum, range, Q1, Q3, and IQR are required. **Optional challenge:** calculate the variance and sample standard deviation; for sample standard deviation, divide by **n − 1**. To find quartiles with five values, sort the data, leave out the median, then find the median of each half. Round to one decimal place where needed. Include units in your work; variance is in cm².`,
    'I. Statistics — Results for the Other IV Levels': `Complete the required statistics table for the remaining ramp heights. Q1, Q3, and IQR are required; variance and standard deviation are optional challenges. Use these trial results:

| Ramp height (cm) | Distances (cm) |
|:--:|:--|
| 10 | 45, 42, 48, 45, 50 |
| 20 | 92, 88, 95, 92, 93 |

Write **none** if there is no mode. Round to one decimal place where needed.`,
    'I. Statistics — Interpret Your Results': `Use your calculated range and IQR to compare how consistent the distances were at each ramp height. If you completed the optional challenge, you may also use standard deviation. Remember that variance is expressed in squared units.`,
  },
  prompts: [
    // ── G. Quantitative Data ──
    {
      sectionHeader: 'G. Quantitative Data',
      label: 'Raw Data Table',
      type: 'table',
      subLabel:
        'Enter clear column headings with units, then enter the three IV levels and all five trials.',
      columns: ['', '', '', '', '', ''],
      editableColumnHeaders: true,
      expectedColumns: [
        'Ramp Height (cm)',
        'Trial 1 (cm)',
        'Trial 2 (cm)',
        'Trial 3 (cm)',
        'Trial 4 (cm)',
        'Trial 5 (cm)',
      ],
      rows: 3,
      prefilled: [
        [null, null, null, null, null, null],
        [null, null, null, null, null, null],
        [null, null, null, null, null, null],
      ],
      expectedTableValues: [
        ['10', '45', '42', '48', '45', '50'],
        ['20', '92', '88', '95', '92', '93'],
        ['30', '135', '130', '138', '142', '135'],
      ],
    },
    {
      label: 'Condensed Data Table',
      type: 'table',
      subLabel: 'Enter clear column headings with units. Include only the means you will graph.',
      columns: ['', ''],
      editableColumnHeaders: true,
      expectedColumns: ['Ramp Height (cm)', 'Mean Distance (cm)'],
      rows: 3,
      prefilled: [
        ['10', null],
        ['20', null],
        ['30', null],
      ],
      expectedTableValues: [
        ['10', '46.0'],
        ['20', '92.0'],
        ['30', '136.0'],
      ],
    },
    {
      label: 'Sample Calculation — Mean',
      type: 'text',
      subLabel:
        'Show how you calculated the mean distance at 20 cm. Include the measurements, division, and units.',
    },

    // ── H. Graph ──
    {
      sectionHeader: 'H. Graph',
      label: 'Build Your Graph',
      type: 'graph',
      graphConfig: { xMin: 0, xMax: 50, yMin: 0, yMax: 200, maxPoints: 3 },
    },

    // ── I. Statistics: sample calculations at 30 cm (135, 130, 138, 142, 135) ──
    {
      sectionHeader: 'I. Statistics — Sample Calculation at 30 cm',
      label: 'Mean (cm)',
      type: 'number',
      subLabel: 'Data: 135, 130, 138, 142, 135 cm',
      expectedAnswer: 136.0,
      tolerance: 0.1,
    },
    {
      label: 'Median (cm)',
      type: 'number',
      expectedAnswer: 135,
      tolerance: 0.1,
    },
    {
      label: 'Mode (cm)',
      type: 'number',
      expectedAnswer: 135,
      tolerance: 0.1,
    },
    {
      label: 'Minimum (cm)',
      type: 'number',
      expectedAnswer: 130,
      tolerance: 0.1,
    },
    {
      label: 'Maximum (cm)',
      type: 'number',
      expectedAnswer: 142,
      tolerance: 0.1,
    },
    {
      label: 'Range (cm)',
      type: 'number',
      expectedAnswer: 12,
      tolerance: 0.1,
    },
    {
      label: 'Optional Challenge — Deviations Table (30 cm)',
      type: 'table',
      subLabel:
        'Optional challenge: use the mean you found above to calculate each deviation and squared deviation.',
      columns: ['Data Value (cm)', 'Deviation (cm)', 'Squared Deviation (cm²)'],
      rows: 5,
      prefilled: [
        ['135', null, null],
        ['130', null, null],
        ['138', null, null],
        ['142', null, null],
        ['135', null, null],
      ],
      expectedTableValues: [
        ['135', '-1', '1'],
        ['130', '-6', '36'],
        ['138', '2', '4'],
        ['142', '6', '36'],
        ['135', '-1', '1'],
      ],
    },
    {
      label: 'Optional Challenge — Variance (cm²)',
      type: 'number',
      subLabel: 'Divide the sum of the squared deviations by n − 1.',
      expectedAnswer: 19.5,
      tolerance: 0.1,
    },
    {
      label: 'Optional Challenge — Standard Deviation (cm)',
      type: 'number',
      expectedAnswer: 4.4,
      tolerance: 0.1,
    },
    {
      label: 'Q1 (cm)',
      type: 'number',
      expectedAnswer: 132.5,
      tolerance: 0.1,
    },
    {
      label: 'Q3 (cm)',
      type: 'number',
      expectedAnswer: 140,
      tolerance: 0.1,
    },
    {
      label: 'IQR (cm)',
      type: 'number',
      expectedAnswer: 7.5,
      tolerance: 0.1,
    },

    // ── I. Statistics: remaining IV levels ──
    {
      sectionHeader: 'I. Statistics — Results for the Other IV Levels',
      label: 'Central Tendency and Range',
      type: 'table',
      subLabel:
        'Calculate these statistics for each remaining ramp height. Write "none" if there is no mode. Round to one decimal place. The 30 cm level is done above.',
      columns: [
        'Ramp Height (cm)',
        'Mean (cm)',
        'Median (cm)',
        'Mode (cm)',
        'Min (cm)',
        'Max (cm)',
        'Range (cm)',
      ],
      rows: 2,
      prefilled: [
        ['10', null, null, null, null, null, null],
        ['20', null, null, null, null, null, null],
      ],
      expectedTableValues: [
        ['10', '46', '45', '45', '42', '50', '8'],
        ['20', '92', '92', '92', '88', '95', '7'],
      ],
    },
    {
      label: 'Quartiles and Variation',
      type: 'table',
      subLabel:
        'Required: calculate Q1, Q3, and IQR for each ramp height. Optional challenge: calculate the sample variance and sample standard deviation.',
      columns: [
        'Ramp Height (cm)',
        'Q1 (cm)',
        'Q3 (cm)',
        'IQR (cm)',
        'Variance (cm²)',
        'Std. Dev. (cm)',
      ],
      rows: 2,
      prefilled: [
        ['10', null, null, null, null, null],
        ['20', null, null, null, null, null],
      ],
      expectedTableValues: [
        ['10', '43.5', '49', '5.5', '9.5', '3.1'],
        ['20', '90', '94', '4', '6.5', '2.5'],
      ],
    },

    // ── I. Statistics: interpretation ──
    {
      sectionHeader: 'I. Statistics — Interpret Your Results',
      label: 'Optional Challenge — Units of Variance',
      type: 'short-answer',
      subLabel: 'Optional challenge: what are the units of the variance when the data is in cm?',
      inputLabel: 'Units',
    },
    {
      label: 'Consistency Across Levels',
      type: 'text',
      subLabel:
        'Which ramp height gave the most consistent distances, and which gave the least consistent? Use range and IQR as evidence. If you completed the optional challenge, you may also use standard deviation.',
    },
  ],
  dueDate: '',
  createdAt: '2026-10-22',
};

function createSimplifiedReportSectionsGITask(): TaskDefinition {
  const fullTask = TASK_020;

  const sectionInstructions = { ...fullTask.sectionInstructions };
  sectionInstructions['I. Statistics — Sample Calculation at 30 cm'] =
    `Calculate the statistics for the 30 cm ramp height using these five distances: **135, 130, 138, 142, 135 cm**. Mean, median, mode, minimum, maximum, range, Q1, Q3, and IQR are required. To find quartiles with five values, sort the data, leave out the median, then find the median of each half. Round to one decimal place where needed and include units in your work.`;
  sectionInstructions['I. Statistics — Results for All IV Levels'] =
    `Complete both statistics tables for all three ramp heights. The sample calculations above show how to find the statistics for 30 cm. Use these trial results:

| Ramp height (cm) | Distances (cm) |
|:--:|:--|
| 10 | 45, 42, 48, 45, 50 |
| 20 | 92, 88, 95, 92, 93 |
| 30 | 135, 130, 138, 142, 135 |

Calculate the mean, median, mode, minimum, maximum, range, Q1, Q3, and IQR. Write **none** if there is no mode. Round to one decimal place where needed.`;
  delete sectionInstructions['I. Statistics — Results for the Other IV Levels'];
  delete sectionInstructions['I. Statistics — Interpret Your Results'];

  const removedPromptLabels = new Set([
    'Optional Challenge — Deviations Table (30 cm)',
    'Optional Challenge — Variance (cm²)',
    'Optional Challenge — Standard Deviation (cm)',
    'Optional Challenge — Units of Variance',
    'Consistency Across Levels',
  ]);
  const sampleData = '135, 130, 138, 142, 135 cm';
  const sampleCalculationWork: Record<string, string> = {
    'Mean (cm)': 'Show the addition and division you used to find the mean.',
    'Median (cm)': 'Sort the data and show how you found the middle value.',
    'Mode (cm)': 'Show which value occurs most often.',
    'Minimum (cm)': 'Identify the smallest value in the data.',
    'Maximum (cm)': 'Identify the largest value in the data.',
    'Range (cm)': 'Show maximum minus minimum.',
    'Q1 (cm)': 'Sort the data, leave out the median, and show the median of the lower half.',
    'Q3 (cm)': 'Sort the data, leave out the median, and show the median of the upper half.',
    'IQR (cm)': 'Show Q3 minus Q1.',
  };
  const prompts = fullTask.prompts
    .filter((prompt) => !removedPromptLabels.has(prompt.label))
    .map((prompt) => {
      if (prompt.label === 'Sample Calculation — Mean') {
        return {
          ...prompt,
          subLabel:
            'Data: 92, 88, 95, 92, 93 cm. Show your addition, division, and answer with units.',
          textRows: 3,
        };
      }
      if (sampleCalculationWork[prompt.label]) {
        return {
          ...prompt,
          type: 'text' as const,
          subLabel: `Data: ${sampleData}. ${sampleCalculationWork[prompt.label]}`,
          textRows: 3,
        };
      }
      if (prompt.label === 'Central Tendency and Range') {
        return {
          ...prompt,
          sectionHeader: 'I. Statistics — Results for All IV Levels',
          label: 'Central Tendency',
          subLabel: 'Calculate the mean, median, and mode for each ramp height.',
          columns: ['Ramp Height (cm)', 'Mean (cm)', 'Median (cm)', 'Mode (cm)'],
          rows: 3,
          prefilled: [
            ['10', null, null, null],
            ['20', null, null, null],
            ['30', null, null, null],
          ],
          expectedTableValues: [
            ['10', '46', '45', '45'],
            ['20', '92', '92', '92'],
            ['30', '136', '135', '135'],
          ],
        };
      }
      if (prompt.label === 'Quartiles and Variation') {
        return {
          ...prompt,
          subLabel: 'Calculate the minimum, maximum, range, Q1, Q3, and IQR for each ramp height.',
          columns: [
            'Ramp Height (cm)',
            'Min (cm)',
            'Max (cm)',
            'Range (cm)',
            'Q1 (cm)',
            'Q3 (cm)',
            'IQR (cm)',
          ],
          rows: 3,
          prefilled: [
            ['10', null, null, null, null, null, null],
            ['20', null, null, null, null, null, null],
            ['30', null, null, null, null, null, null],
          ],
          expectedTableValues: [
            ['10', '42', '50', '8', '43.5', '49', '5.5'],
            ['20', '88', '95', '7', '90', '94', '4'],
            ['30', '130', '142', '12', '132.5', '140', '7.5'],
          ],
        };
      }
      return prompt;
    });

  return {
    ...fullTask,
    id: 'task-021-report-sections-g-i-core',
    title: 'Report Writing Practice: Sections G–I (Toy Car Ramp) — Core Practice',
    prompts,
    sectionInstructions,
  };
}

export const TASK_021 = createSimplifiedReportSectionsGITask();
