import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { createBlankManualCalcs, ReportSubmission } from '../../core/models/submission.model';
import { AiDataService } from '../../core/services/ai-data.service';
import { computeAll } from '../../core/utils/statistics';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog';
import { DataTableStepComponent } from '../practice-events/report-builder/steps/data-table';
import { GraphStepComponent } from '../practice-events/report-builder/steps/graph';
import { StatisticsStepComponent } from '../practice-events/report-builder/steps/statistics';
import {
  blankExtraStatistics,
  createWorkspace,
  drawnLine,
  exampleWorkspace,
  ExtraStatistics,
  GuideWorkspace,
  isGuideWorkspace,
} from './workspace.model';
import { InteractiveWorkspaceService } from './workspace.service';

type ExperimentField = 'independentVar' | 'dependentVar' | 'hypothesis' | 'procedure';

@Component({
  selector: 'app-data-graph-guide',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, MatButtonModule, MatCardModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatProgressSpinnerModule, DataTableStepComponent,
    GraphStepComponent, StatisticsStepComponent,
  ],
  templateUrl: './data-graph-guide.html',
  styleUrl: './data-graph-guide.scss',
  host: { '(window:beforeunload)': 'beforeUnload($event)' },
})
export class DataGraphGuideComponent implements OnInit {
  private readonly storage = inject(InteractiveWorkspaceService);
  private readonly ai = inject(AiDataService);
  private readonly dialog = inject(MatDialog);

  protected readonly workspace = signal(createWorkspace());
  protected readonly tableSyncVersion = signal(0);
  protected readonly statisticsSyncVersion = signal(0);
  protected readonly graphSyncVersion = signal(0);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly generating = signal(false);
  protected readonly replacing = signal(false);
  protected readonly loadError = signal('');
  protected readonly saveError = signal('');
  protected readonly aiMessage = signal('');
  protected readonly showExtraCheck = signal(false);
  private readonly savedSnapshot = signal(JSON.stringify(createWorkspace()));
  protected readonly dirty = computed(() => JSON.stringify(this.workspace()) !== this.savedSnapshot());
  protected readonly line = computed(() => {
    const graph = this.workspace().graphData;
    return drawnLine(graph.lobfStart, graph.lobfEnd);
  });
  protected readonly extraFields: { key: keyof ExtraStatistics; label: string }[] = [
    { key: 'min', label: 'Minimum' }, { key: 'max', label: 'Maximum' },
    { key: 'q1', label: 'Q1' }, { key: 'q3', label: 'Q3' },
  ];

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');
    try {
      const workspace = await this.storage.load() ?? createWorkspace();
      this.workspace.set(workspace);
      this.savedSnapshot.set(JSON.stringify(workspace));
      this.resyncAll();
    } catch (error) {
      console.error('Failed to load interactive guide workspace:', error);
      this.loadError.set(error instanceof Error ? error.message : 'Could not load your workspace. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  canDeactivate(): boolean {
    return !this.dirty() && !this.saving() && !this.generating() && !this.replacing();
  }

  protected beforeUnload(event: BeforeUnloadEvent): void {
    if (!this.canDeactivate()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  protected async save(): Promise<void> {
    const snapshot = structuredClone(this.workspace());
    if (!isGuideWorkspace(snapshot)) {
      this.saveError.set('The workspace contains invalid data. Check your entries before saving.');
      return;
    }
    this.saving.set(true);
    this.saveError.set('');
    try {
      await this.storage.save(snapshot);
      this.savedSnapshot.set(JSON.stringify(snapshot));
    } catch (error) {
      console.error('Failed to save interactive guide workspace:', error);
      this.saveError.set('Could not save your workspace. Your changes are still on this page; please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  protected updateExperiment(field: ExperimentField, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.workspace.update((workspace) => ({ ...workspace, [field]: value }));
  }

  protected updateFromStep(change: Partial<ReportSubmission>, source: 'table' | 'statistics' | 'graph'): void {
    this.workspace.update((workspace) => {
      const rows = change.dataTable ?? workspace.dataTable;
      return {
        ...workspace,
        ...(change.dataTable !== undefined && { dataTable: change.dataTable }),
        ...(change.numTrials !== undefined && { numTrials: change.numTrials }),
        ...(change.dataTableIvHeader !== undefined && { dataTableIvHeader: change.dataTableIvHeader }),
        ...(change.dataTableDvHeader !== undefined && { dataTableDvHeader: change.dataTableDvHeader }),
        ...(change.manualCalculations !== undefined && { manualCalculations: change.manualCalculations }),
        ...(change.statisticsNotes !== undefined && { statisticsNotes: change.statisticsNotes }),
        ...(change.graphData !== undefined && { graphData: change.graphData }),
        extraStatistics: rows.map((_, index) => workspace.extraStatistics[index] ?? blankExtraStatistics()),
      };
    });
    if (source === 'table' || (source === 'graph' && change.manualCalculations !== undefined)) {
      this.statisticsSyncVersion.update((version) => version + 1);
    }
    if (source === 'statistics' && change.manualCalculations !== undefined) {
      this.graphSyncVersion.update((version) => version + 1);
    }
  }

  protected updateExtra(row: number, field: keyof ExtraStatistics, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.workspace.update((workspace) => ({
      ...workspace,
      extraStatistics: workspace.extraStatistics.map((item, index) =>
        index === row ? { ...item, [field]: value } : item),
    }));
    this.showExtraCheck.set(false);
  }

  protected extraResult(row: number, field: keyof ExtraStatistics): string {
    const workspace = this.workspace();
    const entry = workspace.dataTable[row];
    const answer = workspace.extraStatistics[row][field].trim();
    if (!answer) return 'Not answered';
    const keys = ['trial1', 'trial2', 'trial3', 'trial4', 'trial5'] as const;
    const values = keys.slice(0, workspace.numTrials).map((key) => entry[key]);
    if (values.some((value) => value === null || !Number.isFinite(value))) return 'Complete all trials first';
    const expected = computeAll(values.filter((value): value is number => value !== null))[field];
    const actual = Number(answer);
    return Number.isFinite(actual) && Math.abs(actual - expected) < 0.015 ? 'Correct' : 'Try again';
  }

  protected async useExample(): Promise<void> {
    if (!await this.confirmReplacement('Load example data?', 'This replaces the current workspace, including calculations and graph.')) return;
    this.workspace.set(exampleWorkspace());
    this.resyncAll();
    this.showExtraCheck.set(false);
    this.aiMessage.set('');
  }

  protected async reset(): Promise<void> {
    if (!await this.confirmReplacement('Start a blank workspace?', 'This replaces the current workspace, including calculations and graph.')) return;
    this.workspace.set(createWorkspace());
    this.resyncAll();
    this.showExtraCheck.set(false);
    this.aiMessage.set('');
  }

  protected async generateData(): Promise<void> {
    if (!await this.confirmReplacement(
      'Generate a practice experiment?',
      'AI will invent an experiment and fictional data. This replaces the entire workspace, including your calculations and graph.',
    )) return;
    const snapshot = JSON.stringify(this.workspace());
    this.generating.set(true);
    this.aiMessage.set('');
    try {
      const result = await this.ai.generateGuideExample();
      if (snapshot !== JSON.stringify(this.workspace())) {
        this.aiMessage.set('The workspace changed during generation, so the generated data was not applied. Try again.');
        return;
      }
      this.workspace.set({
        ...createWorkspace(),
        independentVar: result.independentVar,
        dependentVar: result.dependentVar,
        hypothesis: result.hypothesis,
        procedure: result.procedure,
        dataTableIvHeader: result.independentVar,
        dataTableDvHeader: result.dependentVar,
        dataTable: result.dataTable,
        manualCalculations: createBlankManualCalcs(result.dataTable.length, 3),
        extraStatistics: result.dataTable.map(() => blankExtraStatistics()),
      });
      this.resyncAll();
      this.showExtraCheck.set(false);
      this.aiMessage.set(`AI-generated practice data (not real measurements). ${result.notes}`);
    } catch (error) {
      console.error('Failed to generate interactive guide data:', error);
      this.aiMessage.set(error instanceof Error ? error.message : 'Data generation failed. Please try again.');
    } finally {
      this.generating.set(false);
    }
  }

  protected formatNumber(value: number): string {
    return Number(value.toPrecision(5)).toString();
  }

  private resyncAll(): void {
    this.tableSyncVersion.update((version) => version + 1);
    this.statisticsSyncVersion.update((version) => version + 1);
    this.graphSyncVersion.update((version) => version + 1);
  }

  private async confirmReplacement(title: string, message: string): Promise<boolean> {
    this.replacing.set(true);
    try {
      const ref = this.dialog.open(ConfirmDialogComponent, {
        width: '420px',
        data: { title, message, confirmText: 'Replace', cancelText: 'Cancel', confirmColor: 'warn', icon: 'warning' },
      });
      return (await firstValueFrom(ref.afterClosed())) === true;
    } finally {
      this.replacing.set(false);
    }
  }
}
