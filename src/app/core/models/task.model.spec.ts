import {
  createInitialTaskResponse,
  parseTaskTableResponse,
  TASK_DEFINITIONS,
  TaskPrompt,
} from './task.model';

describe('createInitialTaskResponse', () => {
  it('preserves the legacy editable-table response shape and prefilled cells', () => {
    const prompt: TaskPrompt = {
      label: 'Results',
      type: 'table',
      columns: ['IV', 'Mean'],
      rows: 2,
      prefilled: [
        ['10', null],
        ['20', null],
      ],
    };

    expect(JSON.parse(createInitialTaskResponse(prompt))).toEqual([
      ['10', ''],
      ['20', ''],
    ]);
  });

  it('stores editable column headings with the table rows', () => {
    const prompt: TaskPrompt = {
      label: 'Raw data',
      type: 'table',
      columns: ['', ''],
      editableColumnHeaders: true,
      rows: 2,
    };

    expect(JSON.parse(createInitialTaskResponse(prompt))).toEqual({
      headers: ['', ''],
      rows: [
        ['', ''],
        ['', ''],
      ],
    });
  });

  it('migrates legacy first-row headings when reading an editable table', () => {
    const prompt: TaskPrompt = {
      label: 'Raw data',
      type: 'table',
      columns: ['', ''],
      editableColumnHeaders: true,
      rows: 1,
    };

    expect(
      parseTaskTableResponse(
        JSON.stringify([
          ['Ramp height (cm)', 'Distance (cm)'],
          ['10', '46'],
        ]),
        prompt,
      ),
    ).toEqual({
      headers: ['Ramp height (cm)', 'Distance (cm)'],
      rows: [['10', '46']],
    });
  });

  it('trims obsolete rows from saved editable-table responses', () => {
    const prompt: TaskPrompt = {
      label: 'Condensed data',
      type: 'table',
      columns: ['', ''],
      editableColumnHeaders: true,
      rows: 3,
    };

    expect(
      parseTaskTableResponse(
        JSON.stringify({
          headers: ['Ramp height (cm)', 'Mean distance (cm)'],
          rows: [
            ['10', '46'],
            ['20', '92'],
            ['30', '136'],
            ['40', '166'],
          ],
        }),
        prompt,
      ),
    ).toEqual({
      headers: ['Ramp height (cm)', 'Mean distance (cm)'],
      rows: [
        ['10', '46'],
        ['20', '92'],
        ['30', '136'],
      ],
    });
  });

  it('trims obsolete rows while preserving fixed-table prefills', () => {
    const prompt: TaskPrompt = {
      label: 'Statistics',
      type: 'table',
      columns: ['Ramp height', 'Mean'],
      rows: 2,
      prefilled: [
        ['10', null],
        ['20', null],
      ],
    };

    expect(
      parseTaskTableResponse(
        JSON.stringify([
          ['10', '46'],
          ['20', '92'],
          ['40', '166'],
        ]),
        prompt,
      ),
    ).toEqual({
      headers: ['Ramp height', 'Mean'],
      rows: [
        ['10', '46'],
        ['20', '92'],
      ],
    });
  });

  it('migrates legacy headers and trims old rows after a table size change', () => {
    const prompt: TaskPrompt = {
      label: 'Raw data',
      type: 'table',
      columns: ['', ''],
      editableColumnHeaders: true,
      expectedColumns: ['Ramp height (cm)', 'Distance (cm)'],
      rows: 3,
    };

    expect(
      parseTaskTableResponse(
        JSON.stringify([
          ['Ramp height (cm)', 'Distance (cm)'],
          ['10', '46'],
          ['20', '92'],
          ['30', '136'],
          ['40', '166'],
        ]),
        prompt,
      ),
    ).toEqual({
      headers: ['Ramp height (cm)', 'Distance (cm)'],
      rows: [
        ['10', '46'],
        ['20', '92'],
        ['30', '136'],
      ],
    });
  });

  it('initializes a blank graph using its configured bounds', () => {
    const prompt: TaskPrompt = {
      label: 'Graph',
      type: 'graph',
      graphConfig: { xMin: 0, xMax: 50, yMin: 0, yMax: 200, maxPoints: 4 },
    };

    expect(JSON.parse(createInitialTaskResponse(prompt))).toEqual({
      title: '',
      xAxisLabel: '',
      yAxisLabel: '',
      xMin: 0,
      xMax: 50,
      yMin: 0,
      yMax: 200,
      points: [],
      lobfStart: null,
      lobfEnd: null,
      chartType: 'scatter',
    });
  });
});

describe('task definition compatibility', () => {
  it('keeps existing markdown tasks while allowing inline section instructions', () => {
    const legacyTask = TASK_DEFINITIONS.find(
      (task) => task.id === 'task-019-report-sections-a-e-buoyancy',
    );
    const sectionedTask = TASK_DEFINITIONS.find(
      (task) => task.id === 'task-020-report-sections-g-i',
    );

    expect(legacyTask?.promptFile).toBe('tasks/task-019-report-sections-a-e-buoyancy.md');
    expect(legacyTask?.sectionInstructions).toBeUndefined();
    expect(sectionedTask?.promptFile).toBeUndefined();
    expect(sectionedTask?.sectionInstructions?.['G. Quantitative Data']).toContain(
      'Notebook measurements',
    );
  });

  it('keeps each statistics results table compact enough to use on screen', () => {
    const task = TASK_DEFINITIONS.find((item) => item.id === 'task-020-report-sections-g-i');
    const statisticsTables = task?.prompts.filter(
      (prompt) => prompt.type === 'table' && prompt.expectedTableValues,
    );
    const resultsTables = statisticsTables?.filter((prompt) =>
      ['Central Tendency and Range', 'Quartiles and Variation'].includes(prompt.label),
    );

    expect(resultsTables).toHaveLength(2);
    expect(resultsTables?.every((prompt) => (prompt.columns?.length ?? 0) <= 7)).toBe(true);
  });

  it('uses the same three IV levels across tables, graph, and remaining-level statistics', () => {
    const task = TASK_DEFINITIONS.find((item) => item.id === 'task-020-report-sections-g-i');
    const rawTable = task?.prompts.find((prompt) => prompt.label === 'Raw Data Table');
    const condensedTable = task?.prompts.find((prompt) => prompt.label === 'Condensed Data Table');
    const graph = task?.prompts.find((prompt) => prompt.label === 'Build Your Graph');
    const centralTendency = task?.prompts.find(
      (prompt) => prompt.label === 'Central Tendency and Range',
    );
    const quartiles = task?.prompts.find((prompt) => prompt.label === 'Quartiles and Variation');

    expect(rawTable?.expectedTableValues?.map((row) => row[0])).toEqual(['10', '20', '30']);
    expect(rawTable?.rows).toBe(3);
    expect(condensedTable?.expectedTableValues?.map((row) => row[0])).toEqual(['10', '20', '30']);
    expect(condensedTable?.rows).toBe(3);
    expect(graph?.graphConfig?.maxPoints).toBe(3);
    expect(centralTendency?.expectedTableValues?.map((row) => row[0])).toEqual(['10', '20']);
    expect(quartiles?.expectedTableValues?.map((row) => row[0])).toEqual(['10', '20']);
  });

  it('keeps the full task and adds a core version without optional or interpretation prompts', () => {
    const fullTask = TASK_DEFINITIONS.find(
      (item) => item.id === 'task-020-report-sections-g-i',
    );
    const coreTask = TASK_DEFINITIONS.find(
      (item) => item.id === 'task-021-report-sections-g-i-core',
    );
    const centralTendency = coreTask?.prompts.find((prompt) => prompt.label === 'Central Tendency');
    const quartiles = coreTask?.prompts.find((prompt) => prompt.label === 'Quartiles and Variation');
    const sampleMean = coreTask?.prompts.find(
      (prompt) => prompt.label === 'Sample Calculation — Mean',
    );
    const sampleCalculationLabels = [
      'Mean (cm)',
      'Median (cm)',
      'Mode (cm)',
      'Minimum (cm)',
      'Maximum (cm)',
      'Range (cm)',
      'Q1 (cm)',
      'Q3 (cm)',
      'IQR (cm)',
    ];
    const sampleStatistics = coreTask?.prompts.filter(
      (prompt) => sampleCalculationLabels.includes(prompt.label),
    );

    expect(fullTask?.prompts.some((prompt) => prompt.label.includes('Optional Challenge'))).toBe(
      true,
    );
    expect(coreTask?.title).toContain('Core Practice');
    expect(coreTask?.prompts.some((prompt) => prompt.label.includes('Optional Challenge'))).toBe(
      false,
    );
    expect(coreTask?.prompts.some((prompt) => prompt.label === 'Consistency Across Levels')).toBe(
      false,
    );
    expect(
      coreTask?.sectionInstructions?.['I. Statistics — Interpret Your Results'],
    ).toBeUndefined();
    expect(
      coreTask?.sectionInstructions?.['I. Statistics — Results for the Other IV Levels'],
    ).toBeUndefined();
    expect(
      coreTask?.sectionInstructions?.['I. Statistics — Results for All IV Levels'],
    ).toContain('| 30 | 135, 130, 138, 142, 135 |');
    expect(centralTendency?.expectedTableValues?.map((row) => row[0])).toEqual([
      '10',
      '20',
      '30',
    ]);
    expect(centralTendency?.columns).toEqual([
      'Ramp Height (cm)',
      'Mean (cm)',
      'Median (cm)',
      'Mode (cm)',
    ]);
    expect(quartiles?.columns).toEqual([
      'Ramp Height (cm)',
      'Min (cm)',
      'Max (cm)',
      'Range (cm)',
      'Q1 (cm)',
      'Q3 (cm)',
      'IQR (cm)',
    ]);
    expect(quartiles?.expectedTableValues?.map((row) => row[0])).toEqual([
      '10',
      '20',
      '30',
    ]);
    expect(quartiles?.expectedTableValues?.every((row) => row.length === 7)).toBe(true);
    expect(sampleMean?.subLabel).toContain('Data: 92, 88, 95, 92, 93 cm');
    expect(sampleMean?.textRows).toBe(3);
    expect(sampleStatistics).toHaveLength(9);
    expect(sampleStatistics?.every((prompt) => prompt.type === 'text')).toBe(true);
    expect(sampleStatistics?.every((prompt) => prompt.subLabel?.startsWith('Data: 135'))).toBe(
      true,
    );
    expect(sampleStatistics?.every((prompt) => prompt.textRows === 3)).toBe(true);
  });

  it('marks variance and standard deviation as optional while keeping IQR required', () => {
    const task = TASK_DEFINITIONS.find((item) => item.id === 'task-020-report-sections-g-i');
    const variancePrompt = task?.prompts.find((prompt) => prompt.label.includes('Variance (cm²)'));
    const standardDeviationPrompt = task?.prompts.find((prompt) =>
      prompt.label.includes('Standard Deviation (cm)'),
    );
    const varianceUnitsPrompt = task?.prompts.find(
      (prompt) => prompt.label === 'Optional Challenge — Units of Variance',
    );
    const quartilesPrompt = task?.prompts.find((prompt) => prompt.label === 'Quartiles and Variation');

    expect(variancePrompt?.label).toContain('Optional Challenge');
    expect(standardDeviationPrompt?.label).toContain('Optional Challenge');
    expect(varianceUnitsPrompt?.subLabel).toContain('Optional challenge');
    expect(quartilesPrompt?.subLabel).toContain('Required: calculate Q1, Q3, and IQR');
    expect(quartilesPrompt?.subLabel).toContain('Optional challenge');
  });
});
