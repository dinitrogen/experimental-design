import { ChangeDetectionStrategy, Component, inject, input, output, signal, computed, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReportSubmission, DataTableEntry } from '../../../../core/models/submission.model';
import { AiDataService } from '../../../../core/services/ai-data.service';

const ALL_TRIAL_KEYS = ['trial1', 'trial2', 'trial3', 'trial4', 'trial5'] as const;
type TrialKey = (typeof ALL_TRIAL_KEYS)[number];

@Component({
  selector: 'app-step-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="step-content">
      <h3>
        <mat-icon>table_chart</mat-icon>
        Raw Data Table
      </h3>
      @if (showHints()) {
        <p class="hint">
          Record the raw data for each trial. Means will be calculated in the
          Condensed Table below.
        </p>
      }

      <div class="trial-controls">
        <span class="trial-label">Trials: {{ activeTrialCount() }}</span>
        <button mat-icon-button (click)="removeTrial()"
          [disabled]="activeTrialCount() <= 3"
          aria-label="Remove trial column"
          matTooltip="Remove trial">
          <mat-icon>remove_circle_outline</mat-icon>
        </button>
        <button mat-icon-button (click)="addTrial()"
          [disabled]="activeTrialCount() >= 5"
          aria-label="Add trial column"
          matTooltip="Add trial">
          <mat-icon>add_circle_outline</mat-icon>
        </button>
      </div>

      <div class="table-wrapper" role="region" aria-label="Raw data table" tabindex="0">
        <table class="data-table">
          <thead>
            <tr>
              <th rowspan="2">
                <input class="header-input"
                  [value]="localIvHeader()"
                  (input)="updateIvHeader($event)"
                  placeholder="IV label"
                  aria-label="Independent variable column header" />
              </th>
              <th [attr.colspan]="activeTrialCount()">
                <input class="header-input"
                  [value]="localDvHeader()"
                  (input)="updateDvHeader($event)"
                  placeholder="DV label"
                  aria-label="Dependent variable column header" />
              </th>
            </tr>
            <tr>
              @for (n of activeTrialNums(); track n) {
                <th>Trial {{ n }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of localRows(); track ri; let ri = $index) {
              <tr>
                <td>
                  <input class="cell-input"
                    [value]="row.ivValue"
                    (input)="updateCell(ri, 'ivValue', $event)"
                    [attr.aria-label]="'IV value for row ' + (ri + 1)" />
                </td>
                @for (t of activeTrialKeys(); track t) {
                  <td>
                    <input class="cell-input numeric"
                      type="text" inputmode="decimal"
                      [value]="displayVal(row[t])"
                      (input)="updateCell(ri, t, $event)"
                      [attr.aria-label]="'Trial ' + t.slice(5) + ' for row ' + (ri + 1)" />
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="table-actions">
        <button mat-button (click)="addRow()"
          [disabled]="localRows().length >= 5">
          <mat-icon>add</mat-icon> Add Row
        </button>
        <button mat-button (click)="removeLastRow()"
          [disabled]="localRows().length <= 3">
          <mat-icon>remove</mat-icon> Remove Last Row
        </button>
        <span class="spacer"></span>
        <span [matTooltip]="!independentVar() || !dependentVar()
            ? 'Fill in your Independent and Dependent Variables first (Step 3)'
            : 'Use AI to populate realistic sample data based on your experiment'">
          <button mat-stroked-button class="ai-btn" (click)="generateData()"
            [disabled]="generating() || !independentVar() || !dependentVar()">
            @if (generating()) {
              <mat-spinner diameter="18"></mat-spinner>
            } @else {
              <mat-icon>auto_awesome</mat-icon>
            }
            {{ generating() ? 'Generating...' : 'Generate Sample Data' }}
          </button>
        </span>
      </div>
      @if (aiNotes()) {
        <div class="ai-notes">
          <mat-icon>lightbulb</mat-icon>
          <span>{{ aiNotes() }}</span>
        </div>
      }

      <!-- Condensed Table -->
      <h3>
        <mat-icon>compress</mat-icon>
        Condensed Data Table
      </h3>
      @if (showHints()) {
        <p class="hint">
          Calculate the mean for each IV level. Show your work for one level in the
          example calculation below.
        </p>
      }

      <div class="table-wrapper" role="region" aria-label="Condensed data table" tabindex="0">
        <table class="data-table condensed">
          <thead>
            <tr>
              <th>{{ localIvHeader() || 'IV Value' }}</th>
              <th>Mean ({{ localDvHeader() || 'DV' }})</th>
            </tr>
          </thead>
          <tbody>
            @for (row of localRows(); track ri; let ri = $index) {
              <tr>
                <td class="iv-cell">{{ row.ivValue || '—' }}</td>
                <td>
                  <div class="cell-wrapper">
                    <input class="cell-input numeric"
                      type="text" inputmode="decimal"
                      [value]="displayVal(row.mean)"
                      (input)="updateCell(ri, 'mean', $event)"
                      [class.correct]="allowCheckMyWork() && showMeanValidation() && isMeanCorrect(ri)"
                      [class.incorrect]="allowCheckMyWork() && showMeanValidation() && !isMeanCorrect(ri) && row.mean !== null"
                      [attr.aria-label]="'Mean for row ' + (ri + 1)" />
                    @if (allowCheckMyWork() && showMeanValidation() && row.mean !== null) {
                      <mat-icon class="validation-icon" [class.correct]="isMeanCorrect(ri)" [class.incorrect]="!isMeanCorrect(ri)">
                        {{ isMeanCorrect(ri) ? 'check_circle' : 'cancel' }}
                      </mat-icon>
                    }
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (allowCheckMyWork()) {
        <div class="check-section">
          <button mat-stroked-button (click)="checkMeans()">
            <mat-icon>check_circle</mat-icon>
            Check My Calculations
          </button>
        </div>
      }

    </div>
  `,
  styles: `
    .step-content { max-width: 900px; }
    h3 { display: flex; align-items: center; gap: 8px; margin: 24px 0 4px; font-weight: 500; }
    h3:first-child { margin-top: 8px; }
    h4 { display: flex; align-items: center; gap: 8px; margin: 0 0 4px; font-weight: 500; font-size: 15px; }
    .hint { color: #666; font-size: 14px; margin: 0 0 16px; }

    .trial-controls {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 8px;
    }
    .trial-label { font-size: 14px; font-weight: 500; color: #333; }

    .table-wrapper {
      overflow-x: auto;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }
    .data-table th {
      background: #f5f5f5;
      padding: 10px 12px;
      text-align: center;
      font-weight: 500;
      font-size: 13px;
      border-bottom: 2px solid #e0e0e0;
    }
    .header-input {
      width: 120px;
      padding: 4px 6px;
      border: 1px dashed #bbb;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 500;
      text-align: center;
      background: transparent;
    }
    .header-input:focus {
      border-color: #1565c0;
      border-style: solid;
      outline: none;
      background: #f5f9ff;
    }
    .data-table td {
      padding: 4px 6px;
      text-align: center;
      border-bottom: 1px solid #f0f0f0;
    }

    .cell-input {
      width: 80px;
      padding: 6px 8px;
      border: 1px solid #d0d0d0;
      border-radius: 4px;
      font-size: 14px;
      background: transparent;
      text-align: center;
      transition: border-color 0.2s, background 0.2s;
    }
    .cell-input:hover {
      border-color: #999;
    }
    .cell-input:focus {
      border-color: #1565c0;
      outline: none;
      background: #f5f9ff;
    }
    .cell-input.numeric { width: 70px; }

    .condensed .iv-cell {
      font-weight: 500;
      color: #333;
      padding: 8px 12px;
    }
    .computed-mean {
      font-weight: 500;
      color: #1565c0;
      font-size: 14px;
    }
    .cell-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
    }
    .cell-input.correct { border-color: #2e7d32; background: #e8f5e9; }
    .cell-input.incorrect { border-color: #c62828; background: #ffebee; }
    .validation-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      position: absolute;
      right: -20px;
      top: 50%;
      transform: translateY(-50%);
    }
    .validation-icon.correct { color: #2e7d32; }
    .validation-icon.incorrect { color: #c62828; }
    .check-section {
      margin: 12px 0 16px;
    }

    .table-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      margin-bottom: 8px;
      align-items: center;
    }
    .spacer { flex: 1; }
    .ai-btn {
      color: #6a1b9a;
      border-color: #ce93d8;
    }
    .ai-btn mat-icon { color: #6a1b9a; }
    .ai-btn mat-spinner { display: inline-block; }
    .ai-notes {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 10px 16px;
      background: #f3e5f5;
      border-radius: 8px;
      margin-bottom: 16px;
      color: #4a148c;
      font-size: 13px;
      line-height: 1.5;
    }
    .ai-notes mat-icon {
      color: #6a1b9a;
      flex-shrink: 0;
      margin-top: 2px;
    }

    /* Example calculation section */
    .calc-section {
      background: #fafafa;
      border-radius: 8px;
      padding: 16px 20px;
      margin-top: 16px;
      border-left: 3px solid #1565c0;
    }
    .instruction { color: #555; font-size: 13px; margin: 2px 0 10px; }
    .equation {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 16px;
      margin: 8px 0;
    }
    .op { color: #333; font-weight: 500; }
    .blank-input {
      width: 56px;
      height: 28px;
      text-align: center;
      border: none;
      border-bottom: 2px dashed #1565c0;
      font-size: 14px;
      background: transparent;
      padding: 0 4px;
      font-family: 'Roboto Mono', monospace;
      color: #888;
    }
    .blank-input.sm { width: 36px; }
    .blank-input.result { border-bottom-color: #2e7d32; color: #2e7d32; font-weight: 600; }
  `,
})
export class DataTableStepComponent implements OnInit {
  readonly dataTable = input<DataTableEntry[]>([]);
  readonly numTrials = input(5);
  readonly independentVar = input('');
  readonly dependentVar = input('');
  readonly hypothesis = input('');
  readonly procedure = input('');
  readonly controlledVars = input<string[]>([]);
  readonly dataTableIvHeader = input('');
  readonly dataTableDvHeader = input('');
  readonly showHints = input(true);
  readonly allowCheckMyWork = input(true);
  readonly changed = output<Partial<ReportSubmission>>();

  private readonly aiDataService = inject(AiDataService);

  protected readonly localRows = signal<DataTableEntry[]>([]);
  protected readonly activeTrialCount = signal(5);
  protected readonly showMeanValidation = signal(false);
  protected readonly generating = signal(false);
  protected readonly aiNotes = signal('');
  protected readonly localIvHeader = signal('');
  protected readonly localDvHeader = signal('');

  protected readonly activeTrialNums = computed(() =>
    Array.from({ length: this.activeTrialCount() }, (_, i) => i + 1)
  );
  protected readonly activeTrialKeys = computed(() =>
    ALL_TRIAL_KEYS.slice(0, this.activeTrialCount())
  );

  ngOnInit(): void {
    this.localRows.set(this.dataTable().map((r) => ({ ...r })));
    const n = this.numTrials();
    this.activeTrialCount.set(n >= 3 && n <= 5 ? n : 5);
    this.localIvHeader.set(this.dataTableIvHeader());
    this.localDvHeader.set(this.dataTableDvHeader());
  }

  protected displayVal(v: number | null | undefined): string {
    return v !== null && v !== undefined && !isNaN(v) ? String(v) : '';
  }

  protected computedMean(rowIndex: number): string {
    const row = this.localRows()[rowIndex];
    const keys = this.activeTrialKeys();
    const vals = keys
      .map((k) => row[k])
      .filter((v): v is number => v !== null && v !== undefined && !isNaN(v));
    if (vals.length === 0) return '—';
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    return parseFloat(mean.toFixed(4)).toString();
  }

  protected isMeanCorrect(rowIndex: number): boolean {
    const row = this.localRows()[rowIndex];
    if (row.mean === null) return false;
    const correctStr = this.computedMean(rowIndex);
    if (correctStr === '—') return false;
    const correctNum = parseFloat(correctStr);
    return Math.abs(row.mean - correctNum) < 0.015;
  }

  protected checkMeans(): void {
    this.showMeanValidation.set(true);
  }

  protected updateCell(rowIndex: number, field: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const rows = this.localRows();
    const row = { ...rows[rowIndex] };

    if (field === 'ivValue') {
      row.ivValue = value;
    } else if (field === 'mean') {
      row.mean = value === '' ? null : parseFloat(value);
      if (row.mean !== null && isNaN(row.mean)) row.mean = null;
      this.showMeanValidation.set(false);
    } else {
      const num = value === '' ? null : parseFloat(value);
      (row as Record<string, unknown>)[field] = num !== null && isNaN(num) ? null : num;
    }

    const updated = [...rows];
    updated[rowIndex] = row;
    this.localRows.set(updated);
    this.emitChange();
  }

  protected addRow(): void {
    this.localRows.update((rows) => [
      ...rows,
      { ivValue: '', trial1: null, trial2: null, trial3: null, trial4: null, trial5: null, mean: null },
    ]);
    this.emitChange();
  }

  protected removeLastRow(): void {
    this.localRows.update((rows) => rows.slice(0, -1));
    this.emitChange();
  }

  protected addTrial(): void {
    if (this.activeTrialCount() >= 5) return;
    this.activeTrialCount.update((n) => n + 1);
    this.changed.emit({ numTrials: this.activeTrialCount() });
  }

  protected removeTrial(): void {
    if (this.activeTrialCount() <= 3) return;
    const removed = ALL_TRIAL_KEYS[this.activeTrialCount() - 1];
    // Clear data in the removed column
    const rows = this.localRows().map((r) => ({ ...r, [removed]: null }));
    this.localRows.set(rows);
    this.activeTrialCount.update((n) => n - 1);
    this.changed.emit({ numTrials: this.activeTrialCount(), dataTable: this.localRows() });
  }

  private emitChange(): void {
    this.changed.emit({ dataTable: this.localRows() });
  }

  protected updateIvHeader(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.localIvHeader.set(value);
    this.changed.emit({ dataTableIvHeader: value });
  }

  protected updateDvHeader(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.localDvHeader.set(value);
    this.changed.emit({ dataTableDvHeader: value });
  }

  protected async generateData(): Promise<void> {
    this.generating.set(true);
    this.aiNotes.set('');
    try {
      const ivValues = this.localRows().map((r) => r.ivValue);
      const result = await this.aiDataService.generateData({
        independentVar: this.independentVar(),
        dependentVar: this.dependentVar(),
        controlledVars: this.controlledVars(),
        hypothesis: this.hypothesis(),
        procedure: this.procedure(),
        ivValues,
        numTrials: this.activeTrialCount(),
      });

      // Merge AI data into existing rows (preserving row count)
      const current = this.localRows();
      const updated = current.map((row, i) => {
        const aiRow = result.dataTable[i];
        if (!aiRow) return row;
        return {
          ...row,
          ivValue: row.ivValue || aiRow.ivValue,
          trial1: aiRow.trial1,
          trial2: aiRow.trial2,
          trial3: aiRow.trial3,
          trial4: aiRow.trial4,
          trial5: aiRow.trial5,
          mean: null,
        };
      });
      this.localRows.set(updated);
      this.aiNotes.set(result.notes);
      this.emitChange();
    } catch {
      this.aiNotes.set('Failed to generate data. Make sure you have filled in your variables and procedure first.');
    } finally {
      this.generating.set(false);
    }
  }
}
