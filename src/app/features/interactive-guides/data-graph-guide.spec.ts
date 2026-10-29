import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AiDataService } from '../../core/services/ai-data.service';
import { GraphCanvasComponent } from '../../shared/components/graph-canvas';
import { DataGraphGuideComponent } from './data-graph-guide';
import { createWorkspace, GuideWorkspace } from './workspace.model';
import { InteractiveWorkspaceService } from './workspace.service';

function exampleWorkspace(): GuideWorkspace {
  const workspace = createWorkspace();
  return {
    ...workspace,
    independentVar: 'Ramp height (cm)',
    dependentVar: 'Distance rolled (cm)',
    hypothesis: 'A higher ramp will make the car roll farther.',
    procedure: 'Release the same toy car from rest on the same ramp.',
    dataTable: ['10', '20', '30'].map((ivValue) => ({
      ivValue, trial1: 42, trial2: 45, trial3: 48, trial4: null, trial5: null, mean: null,
    })),
  };
}

describe('DataGraphGuideComponent', () => {
  it('saves entered data, calculations, and exact line endpoints and reloads them', async () => {
    let saved: GuideWorkspace | null = null;
    const save = vi.fn(async (workspace: GuideWorkspace) => { saved = structuredClone(workspace); });
    await TestBed.configureTestingModule({
      imports: [DataGraphGuideComponent],
      providers: [
        provideRouter([]),
        { provide: InteractiveWorkspaceService, useValue: { load: async () => saved, save } },
        { provide: AiDataService, useValue: { generateGuideExample: vi.fn() } },
        { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(true) }) } },
      ],
    }).overrideComponent(GraphCanvasComponent, { set: { template: '' } }).compileComponents();
    const fixture = TestBed.createComponent(DataGraphGuideComponent);
    fixture.detectChanges();
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    const enter = (selector: string, value: string) => {
      const input = page.querySelector<HTMLInputElement>(selector);
      expect(input).not.toBeNull();
      input!.value = value;
      input!.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    const click = (text: string) => {
      const button = [...page.querySelectorAll('button')].find((item) => item.textContent?.includes(text));
      expect(button).toBeDefined();
      button!.click();
      fixture.detectChanges();
    };
    const exact = (label: string, value: string) => {
      const field = [...page.querySelectorAll('mat-form-field')].find((item) =>
        item.textContent?.includes(label),
      );
      const input = field?.querySelector<HTMLInputElement>('input');
      expect(input).toBeDefined();
      input!.value = value;
      input!.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };

    enter('input[aria-label="IV value for row 1"]', '1');
    enter('input[aria-label="Trial 1 for row 1"]', '2');
    enter('input[aria-label="Trial 2 for row 1"]', '3');
    enter('input[aria-label="Trial 3 for row 1"]', '4');
    enter('input[aria-label="Mean for row 1"]', '3');
    enter('input[aria-label="Minimum for row 1"]', '2');
    enter('input[aria-label="mean for 1"]', '3');
    click('Draw LOBF');
    exact('Exact x coordinate', '1.5');
    exact('Exact y coordinate', '2.25');
    click('Place line endpoint');
    exact('Exact x coordinate', '3.5');
    exact('Exact y coordinate', '6.25');
    click('Place line endpoint');
    expect(page.textContent).toContain('Show the calculation for my drawn line');
    enter('input[aria-label="Slope m for equation"]', '2');
    enter('input[aria-label="Intercept b for equation"]', '-0.75');
    const calculationButtons = [...page.querySelectorAll('button')].filter((item) =>
      item.textContent?.includes('Check My Calculations'),
    );
    calculationButtons[calculationButtons.length - 1].click();
    fixture.detectChanges();
    expect(page.querySelector('input[aria-label="Slope m for equation"]')?.classList.contains('correct')).toBe(true);
    expect(page.querySelector('input[aria-label="Intercept b for equation"]')?.classList.contains('correct')).toBe(true);
    expect(fixture.componentInstance.canDeactivate()).toBe(false);
    click('Save workspace');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(save).toHaveBeenCalledOnce();
    expect(saved).toMatchObject({
      dataTable: expect.arrayContaining([expect.objectContaining({ ivValue: '1', trial1: 2, trial2: 3, trial3: 4, mean: 3 })]),
      extraStatistics: expect.arrayContaining([expect.objectContaining({ min: '2' })]),
      graphData: { lobfStart: { x: 1.5, y: 2.25 }, lobfEnd: { x: 3.5, y: 6.25 } },
      manualCalculations: {
        summaryTable: expect.arrayContaining([expect.objectContaining({ mean: '3' })]),
        lobfSlope: '2',
      },
    });
    expect(fixture.componentInstance.canDeactivate()).toBe(true);

    fixture.destroy();
    const reloaded = TestBed.createComponent(DataGraphGuideComponent);
    reloaded.detectChanges();
    await reloaded.componentInstance.ngOnInit();
    reloaded.detectChanges();
    const restored: HTMLElement = reloaded.nativeElement;
    expect(restored.querySelector<HTMLInputElement>('input[aria-label="Mean for row 1"]')?.value).toBe('3');
    expect(restored.querySelector<HTMLInputElement>('input[aria-label="Minimum for row 1"]')?.value).toBe('2');
    expect(restored.textContent).toContain('Show the calculation for my drawn line');
    expect(createWorkspace().dataTable[0].mean).toBeNull();
  });

  it('reports load failures without presenting a blank workspace', async () => {
    await TestBed.configureTestingModule({
      imports: [DataGraphGuideComponent],
      providers: [
        provideRouter([]),
        { provide: InteractiveWorkspaceService, useValue: { load: async () => { throw new Error('Cannot read saved work'); } } },
        { provide: AiDataService, useValue: {} },
        { provide: MatDialog, useValue: {} },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(DataGraphGuideComponent);
    fixture.detectChanges();
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    expect(page.textContent).toContain('Cannot read saved work');
    expect(page.textContent).not.toContain('Reset to blank');
  });

  it('generates explicitly labeled practice data after confirmation without saving it automatically', async () => {
    const example = exampleWorkspace();
    const generated = ['10', '20', '30', '40'].map((ivValue) => ({
      ivValue, trial1: 1, trial2: 2, trial3: 3, trial4: null, trial5: null, mean: null,
    }));
    const generateGuideExample = vi.fn(async () => ({
      independentVar: 'Water temperature (C)',
      dependentVar: 'Dissolving time (s)',
      hypothesis: 'Warmer water reduces the time.',
      procedure: 'Measure the time at each temperature.',
      dataTable: generated,
      notes: 'Fictional values.',
    }));
    const save = vi.fn();
    await TestBed.configureTestingModule({
      imports: [DataGraphGuideComponent],
      providers: [
        provideRouter([]),
        { provide: InteractiveWorkspaceService, useValue: { load: async () => example, save } },
        { provide: AiDataService, useValue: { generateGuideExample } },
        { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(true) }) } },
      ],
    }).overrideComponent(GraphCanvasComponent, { set: { template: '' } }).compileComponents();
    const fixture = TestBed.createComponent(DataGraphGuideComponent);
    fixture.detectChanges();
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    const button = [...page.querySelectorAll('button')].find((item) =>
      item.textContent?.includes('Generate an experiment and data with AI'),
    );
    expect(button!.compareDocumentPosition(page.querySelector('h2')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    button!.click();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(generateGuideExample).toHaveBeenCalledOnce();
    expect(generateGuideExample).toHaveBeenCalledWith();
    expect(page.textContent).toContain('AI-generated practice data (not real measurements)');
    expect([...page.querySelectorAll('input')].some((input) => input.value === 'Water temperature (C)')).toBe(true);
    expect(page.querySelector<HTMLInputElement>('input[aria-label="IV value for row 4"]')?.value).toBe('40');
    expect(page.querySelector<HTMLInputElement>('input[aria-label="Trial 1 for row 1"]')?.value).toBe('1');
    expect(save).not.toHaveBeenCalled();
    expect(fixture.componentInstance.canDeactivate()).toBe(false);
    const mean = page.querySelector<HTMLInputElement>('input[aria-label="Mean for row 1"]')!;
    mean.value = '2';
    mean.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    [...page.querySelectorAll('button')].find((item) => item.textContent?.includes('Check My Calculations'))!.click();
    fixture.detectChanges();
    expect(mean.classList.contains('correct')).toBe(true);
    const summaryMean = page.querySelector<HTMLInputElement>('input[aria-label="mean for 10"]')!;
    summaryMean.value = '2invalid';
    summaryMean.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const checks = [...page.querySelectorAll('button')].filter((item) =>
      item.textContent?.includes('Check My Calculations'),
    );
    checks[1].click();
    fixture.detectChanges();
    expect(summaryMean.classList.contains('incorrect')).toBe(true);
    summaryMean.value = '2';
    summaryMean.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    checks[1].click();
    fixture.detectChanges();
    expect(summaryMean.classList.contains('correct')).toBe(true);

    expect(page.textContent).not.toContain('Load example');
    [...page.querySelectorAll('button')].find((item) => item.textContent?.includes('Reset to blank'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.querySelector<HTMLInputElement>('input[aria-label="IV value for row 1"]')?.value).toBe('');
    button!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(generateGuideExample).toHaveBeenCalledTimes(2);
    expect(page.querySelector<HTMLInputElement>('input[aria-label="IV value for row 4"]')?.value).toBe('40');
  });

  it('generates data for student variables, selecting IV levels if all rows are blank', async () => {
    const example = exampleWorkspace();
    example.dataTable = example.dataTable.map((row) => ({ ...row, ivValue: '' }));
    example.manualCalculations.summaryTable[0].mean = '45';
    example.graphData.lobfStart = { x: 1, y: 1 };
    const generated = ['10', '20', '30'].map((ivValue) => ({
      ivValue, trial1: 1, trial2: 2, trial3: 3, trial4: null, trial5: null, mean: null,
    }));
    const generateGuideData = vi.fn(async () => ({ dataTable: generated, notes: 'Fictional values.' }));
    const save = vi.fn();
    await TestBed.configureTestingModule({
      imports: [DataGraphGuideComponent],
      providers: [
        provideRouter([]),
        { provide: InteractiveWorkspaceService, useValue: { load: async () => example, save } },
        { provide: AiDataService, useValue: { generateGuideData } },
        { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(true) }) } },
      ],
    }).overrideComponent(GraphCanvasComponent, { set: { template: '' } }).compileComponents();
    const fixture = TestBed.createComponent(DataGraphGuideComponent);
    fixture.detectChanges();
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    [...page.querySelectorAll('button')].find((item) =>
      item.textContent?.includes('Generate data for my experiment with AI'),
    )!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(generateGuideData).toHaveBeenCalledWith({
      independentVar: example.independentVar,
      dependentVar: example.dependentVar,
      hypothesis: example.hypothesis,
      procedure: example.procedure,
      controlledVars: [],
      numTrials: 3,
      numLevels: 3,
    });
    expect(page.querySelector<HTMLInputElement>('input[aria-label="IV value for row 1"]')?.value).toBe('10');
    expect(page.querySelector<HTMLInputElement>('input[aria-label="Mean for row 1"]')?.value).toBe('');
    expect(page.textContent).toContain('AI-generated practice data (not real measurements)');
    expect([...page.querySelectorAll('input')].some((input) => input.value === example.independentVar)).toBe(true);
    expect(save).not.toHaveBeenCalled();
    [...page.querySelectorAll('button')].find((item) => item.textContent?.includes('Save workspace'))!.click();
    await fixture.whenStable();
    expect(save).toHaveBeenCalledWith(expect.objectContaining({
      hypothesis: example.hypothesis,
      procedure: example.procedure,
      dataTable: generated,
      graphData: expect.objectContaining({ lobfStart: null, lobfEnd: null }),
      manualCalculations: expect.objectContaining({ summaryTable: expect.arrayContaining([expect.objectContaining({ mean: '' })]) }),
    }));
    const mean = page.querySelector<HTMLInputElement>('input[aria-label="Mean for row 1"]')!;
    mean.value = '2';
    mean.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    [...page.querySelectorAll('button')].find((item) => item.textContent?.includes('Check My Calculations'))!.click();
    fixture.detectChanges();
    expect(mean.classList.contains('correct')).toBe(true);
  });

  it('does not replace student data if data generation is cancelled or fails', async () => {
    const example = exampleWorkspace();
    const generateData = vi.fn().mockRejectedValue(new Error('AI unavailable'));
    const open = vi.fn().mockReturnValueOnce({ afterClosed: () => of(false) })
      .mockReturnValue({ afterClosed: () => of(true) });
    await TestBed.configureTestingModule({
      imports: [DataGraphGuideComponent],
      providers: [
        provideRouter([]),
        { provide: InteractiveWorkspaceService, useValue: { load: async () => example } },
        { provide: AiDataService, useValue: { generateData } },
        { provide: MatDialog, useValue: { open } },
      ],
    }).overrideComponent(GraphCanvasComponent, { set: { template: '' } }).compileComponents();
    const fixture = TestBed.createComponent(DataGraphGuideComponent);
    fixture.detectChanges();
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    const button = [...page.querySelectorAll('button')].find((item) =>
      item.textContent?.includes('Generate data for my experiment with AI'),
    )!;
    button.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(generateData).not.toHaveBeenCalled();
    button.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.textContent).toContain('AI unavailable');
    expect(page.querySelector<HTMLInputElement>('input[aria-label="Trial 1 for row 1"]')?.value).toBe('42');
  });

  it('uses student IV levels and refuses incomplete levels or missing variables', async () => {
    const example = exampleWorkspace();
    const generateData = vi.fn(async () => ({ dataTable: example.dataTable, notes: 'Fictional values.' }));
    await TestBed.configureTestingModule({
      imports: [DataGraphGuideComponent],
      providers: [
        provideRouter([]),
        { provide: InteractiveWorkspaceService, useValue: { load: async () => example } },
        { provide: AiDataService, useValue: { generateData } },
        { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(true) }) } },
      ],
    }).overrideComponent(GraphCanvasComponent, { set: { template: '' } }).compileComponents();
    const fixture = TestBed.createComponent(DataGraphGuideComponent);
    fixture.detectChanges();
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    const button = [...page.querySelectorAll('button')].find((item) =>
      item.textContent?.includes('Generate data for my experiment with AI'),
    )!;
    const row = page.querySelector<HTMLInputElement>('input[aria-label="IV value for row 1"]')!;
    row.value = '';
    row.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    button.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.textContent).toContain('Enter an IV level in every row');
    expect(generateData).not.toHaveBeenCalled();
    row.value = '10';
    row.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    button.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(generateData).toHaveBeenCalledWith(expect.objectContaining({
      independentVar: example.independentVar,
      dependentVar: example.dependentVar,
      ivValues: ['10', '20', '30'],
      numTrials: 3,
    }));
    const field = [...page.querySelectorAll('mat-form-field')].find((item) =>
      item.textContent?.includes('Independent variable (with units)'),
    )!.querySelector('input')!;
    field.value = '';
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    button.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.textContent).toContain('Enter both variables before generating data');
    expect(generateData).toHaveBeenCalledOnce();
  });

  it('preserves the current workspace when generation fails', async () => {
    const generateGuideExample = vi.fn().mockRejectedValue(new Error('AI unavailable'));
    await TestBed.configureTestingModule({
      imports: [DataGraphGuideComponent],
      providers: [
        provideRouter([]),
        { provide: InteractiveWorkspaceService, useValue: { load: async () => exampleWorkspace() } },
        { provide: AiDataService, useValue: { generateGuideExample } },
        { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(true) }) } },
      ],
    }).overrideComponent(GraphCanvasComponent, { set: { template: '' } }).compileComponents();
    const fixture = TestBed.createComponent(DataGraphGuideComponent);
    fixture.detectChanges();
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    const button = [...page.querySelectorAll('button')].find((item) =>
      item.textContent?.includes('Generate an experiment and data with AI'),
    );
    button!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(generateGuideExample).toHaveBeenCalledOnce();
    expect(page.textContent).toContain('AI unavailable');
    expect(page.querySelector<HTMLInputElement>('input[aria-label="Trial 1 for row 1"]')?.value).toBe('42');
  });

  it('requires all active trials before checking a mean', async () => {
    await TestBed.configureTestingModule({
      imports: [DataGraphGuideComponent],
      providers: [
        provideRouter([]),
        { provide: InteractiveWorkspaceService, useValue: { load: async () => null } },
        { provide: AiDataService, useValue: {} },
        { provide: MatDialog, useValue: {} },
      ],
    }).overrideComponent(GraphCanvasComponent, { set: { template: '' } }).compileComponents();
    const fixture = TestBed.createComponent(DataGraphGuideComponent);
    fixture.detectChanges();
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    for (const [label, value] of [['IV value for row 1', '1'], ['Trial 1 for row 1', '5'], ['Mean for row 1', '5']]) {
      const input = page.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }
    const check = [...page.querySelectorAll('button')].find((item) =>
      item.textContent?.includes('Check My Calculations'),
    );
    check!.click();
    fixture.detectChanges();
    expect(page.textContent).toContain('Complete all active trials for each level before checking its mean.');
    expect(page.querySelector('input[aria-label="Mean for row 1"]')?.classList.contains('correct')).toBe(false);
  });
});
