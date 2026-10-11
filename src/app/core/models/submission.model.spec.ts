import { ReportSubmission, createBlankSubmission, getMissingReportSections } from './submission.model';

function blankReport(): ReportSubmission {
  return { id: 'test-report', ...createBlankSubmission('uid-1', 'event-1') } as ReportSubmission;
}

function completeReport(): ReportSubmission {
  const cer = { claim: 'c', evidence: 'e', reasoning: 'r' };
  return {
    ...blankReport(),
    problemStatement: 'p',
    hypothesis: 'h',
    independentVar: 'iv',
    dependentVar: 'dv',
    materials: 'm',
    procedure: 'proc',
    dataTable: [{ ivValue: '1', trial1: 2, trial2: null, trial3: null, trial4: null, trial5: null, mean: null }],
    graphData: {
      title: 't',
      xAxisLabel: 'x',
      yAxisLabel: 'y',
      xMin: 0,
      xMax: 1,
      yMin: 0,
      yMax: 1,
      points: [{ x: 0, y: 0 }],
      lobfStart: null,
      lobfEnd: null,
    },
    statisticsNotes: 's',
    errors: [{ type: 'random', description: 'd', specificError: '', resultImpact: '' }],
    cerTrend: cer,
    cerVariation: cer,
    cerOutliers: cer,
    cerConclusion: cer,
    qualitativeObsResults: 'obs',
    improvements: 'i',
    applications: 'a',
    futureExperiments: 'f',
  };
}

describe('getMissingReportSections', () => {
  it('lists every section for a blank report', () => {
    expect(getMissingReportSections(blankReport())).toEqual([
      'Problem & Hypothesis',
      'Variables',
      'Materials & Procedure',
      'Observations',
      'Data Table',
      'Graph',
      'Statistics',
      'Experimental Errors',
      'CER Analysis',
      'Applications & Improvements',
    ]);
  });

  it('returns no sections for a complete report', () => {
    expect(getMissingReportSections(completeReport())).toEqual([]);
  });

  it('flags a CER section that is missing any part', () => {
    const report = completeReport();
    report.cerOutliers = { claim: 'c', evidence: '', reasoning: 'r' };
    expect(getMissingReportSections(report)).toEqual(['CER Analysis']);
  });

  it('treats whitespace-only text as empty', () => {
    const report = completeReport();
    report.statisticsNotes = '   ';
    expect(getMissingReportSections(report)).toEqual(['Statistics']);
  });
});
