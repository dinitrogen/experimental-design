import { createWorkspace, drawnLine, exampleWorkspace, isGuideWorkspace } from './workspace.model';

describe('interactive guide workspace', () => {
  it('accepts blank and example workspaces after a JSON round trip', () => {
    expect(isGuideWorkspace(JSON.parse(JSON.stringify(createWorkspace())))).toBe(true);
    expect(isGuideWorkspace(JSON.parse(JSON.stringify(exampleWorkspace())))).toBe(true);
  });

  it('rejects invalid or incomplete saved work instead of replacing it silently', () => {
    expect(isGuideWorkspace({ ...createWorkspace(), numTrials: 6 })).toBe(false);
    expect(isGuideWorkspace({ ...createWorkspace(), extraStatistics: [] })).toBe(false);
    expect(isGuideWorkspace({ ...createWorkspace(), manualCalculations: {} })).toBe(false);
    expect(isGuideWorkspace({ ...createWorkspace(), graphData: { points: [] } })).toBe(false);
  });

  it('calculates the equation of the selected line, including negative slopes', () => {
    expect(drawnLine({ x: 2, y: 7 }, { x: 6, y: 3 })).toEqual({ slope: -1, intercept: 9 });
    expect(drawnLine({ x: 2, y: 1 }, { x: 2, y: 5 })).toBeNull();
    expect(drawnLine(null, { x: 2, y: 5 })).toBeNull();
  });
});
