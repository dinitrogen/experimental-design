import { createInitialTaskResponse, TASK_DEFINITIONS, TaskPrompt } from './task.model';

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
});
