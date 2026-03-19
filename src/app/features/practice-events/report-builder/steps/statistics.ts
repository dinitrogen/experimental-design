import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  computed,
  signal,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import {
  DataTableEntry,
  ManualCalculations,
  StatsSummaryRow,
  StdDevWorkRow,
  ReportSubmission,
  createBlankManualCalcs,
} from '../../../../core/models/submission.model';
import * as stats from '../../../../core/utils/statistics';

@Component({
  selector: 'app-step-statistics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
  ],
  template: `
    <div class="step-content">
      @if (dataTable().length === 0) {
        <mat-card class="info-card"><mat-card-content>
          <mat-icon>info</mat-icon>
          <span>Enter data in the Data Table step first, then return here to calculate.</span>
        </mat-card-content></mat-card>
      } @else {

        <!-- 1. SUMMARY TABLE (student fills in) -->
        <h3><mat-icon>grid_on</mat-icon> Statistics Summary Table</h3>
        @if (showHints()) {
          <p class="hint">Fill in each statistic for every IV level. Use the example calculations below to help.</p>
        }
        <div class="table-wrapper">
          <table class="summary-table manual">
            <thead>
              <tr>
                <th>{{ ivLabel() }}</th>
                <th>Mean</th><th>Median</th><th>Mode</th>
                <th>Range</th><th>IQR</th><th>Std Dev</th><th>Variance</th>
              </tr>
            </thead>
            <tbody>
              @for (row of dataTable(); track ri; let ri = $index) {
                <tr>
                  <td class="iv-cell">{{ row.ivValue || '—' }}</td>
                  @for (field of summaryFields; track field) {
                    <td>
                      <div class="cell-wrapper">
                        <input class="cell-input" type="text"
                          [attr.inputmode]="field === 'mode' ? 'text' : 'decimal'"
                          [value]="summaryRow(ri)[field]"
                          (input)="updateSummary(ri, field, $event)"
                          [class.correct]="allowCheckMyWork() && showValidation() && isCellCorrect(ri, field)"
                          [class.incorrect]="allowCheckMyWork() && showValidation() && !isCellCorrect(ri, field) && summaryRow(ri)[field] !== ''"
                          [attr.aria-label]="field + ' for ' + (row.ivValue || 'row ' + (ri + 1))" />
                        @if (allowCheckMyWork() && showValidation() && summaryRow(ri)[field] !== '') {
                          <mat-icon class="validation-icon" [class.correct]="isCellCorrect(ri, field)" [class.incorrect]="!isCellCorrect(ri, field)">
                            {{ isCellCorrect(ri, field) ? 'check_circle' : 'cancel' }}
                          </mat-icon>
                        }
                      </div>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (allowCheckMyWork()) {
          <div class="check-section">
            <button mat-stroked-button (click)="checkSummaryTable()">
              <mat-icon>check_circle</mat-icon>
              Check My Calculations
            </button>
          </div>
        }

        <!-- 2. EXAMPLE CALCULATIONS -->
        <h3><mat-icon>edit</mat-icon> Example Calculations
          <span class="example-label">
            ({{ exampleIvLabel() }})
          </span>
        </h3>
        @if (showHints()) {
          <p class="hint">
            Show one complete example calculation for each statistic using the trial
            data from <strong>{{ exampleIvLabel() }}</strong>.
          </p>
        }

        <!-- ===== CENTRAL TENDENCY ===== -->
        <h3 class="group-heading"><mat-icon>functions</mat-icon> Central Tendency</h3>

        <!-- EXAMPLE: Mean -->
        <section class="calc-section">
          <h4><mat-icon>functions</mat-icon> Mean</h4>
          @if (showHints()) {
            <p class="instruction">Add up all trial values and divide by the number of trials.</p>
          }
          <div class="equation" role="math" aria-label="Mean calculation">
            <span class="op">(</span>
            @for (val of effectiveMeanValues(); track $index; let last = $last) {
              <input class="blank-input" type="text" inputmode="decimal"
                [value]="val"
                [attr.aria-label]="'Trial value ' + ($index + 1)"
                (input)="updateMeanValue($index, $event)" />
              @if (!last) { <span class="op">+</span> }
            }
            <span class="op">) ÷</span>
            <input class="blank-input sm" type="text" inputmode="numeric"
              [value]="localCalcs().meanCount"
              aria-label="Number of trials"
              (input)="updateCalc('meanCount', $event)" />
            <span class="op">=</span>
            <input class="blank-input result" type="text" inputmode="decimal"
              [value]="localCalcs().meanResult"
              aria-label="Mean result"
              (input)="updateCalc('meanResult', $event)" />
          </div>
        </section>

        <!-- EXAMPLE: Median -->
        <section class="calc-section">
          <h4><mat-icon>sort</mat-icon> Median</h4>
          @if (showHints()) {
            <p class="instruction">Write the trial values in order from least to greatest, then find the middle value.</p>
          }
          <div class="equation" role="math" aria-label="Ordered values for median">
            <span class="label">Ordered:</span>
            @for (val of effectiveMedianSorted(); track $index; let last = $last) {
              <input class="blank-input" type="text" inputmode="decimal"
                [value]="val"
                [attr.aria-label]="'Sorted value ' + ($index + 1)"
                (input)="updateMedianSorted($index, $event)" />
              @if (!last) { <span class="op">,</span> }
            }
          </div>
          @if (activeTrials() % 2 === 0) {
            <p class="instruction sub">Even number of values — median is the average of the two middle values.</p>
          }
          <div class="equation">
            <span class="label">Median =</span>
            <input class="blank-input result" type="text" inputmode="decimal"
              [value]="localCalcs().medianResult"
              aria-label="Median result"
              (input)="updateCalc('medianResult', $event)" />
          </div>
        </section>

        <!-- EXAMPLE: Mode -->
        <section class="calc-section">
          <h4><mat-icon>repeat</mat-icon> Mode</h4>
          @if (showHints()) {
            <p class="instruction">The value(s) that appear most often. Write "None" if no value repeats.</p>
          }
          <div class="equation">
            <span class="label">Mode =</span>
            <input class="blank-input wide" type="text"
              [value]="localCalcs().modeResult"
              aria-label="Mode result"
              (input)="updateCalc('modeResult', $event)" />
          </div>
        </section>

        <!-- ===== VARIATION ===== -->
        <h3 class="group-heading"><mat-icon>show_chart</mat-icon> Variation</h3>

        <!-- EXAMPLE: Range -->
        <section class="calc-section">
          <h4><mat-icon>swap_horiz</mat-icon> Range</h4>
          @if (showHints()) {
            <p class="instruction">Subtract the lowest trial value from the highest.</p>
          }
          <div class="equation" role="math" aria-label="Range calculation">
            <input class="blank-input" type="text" inputmode="decimal"
              [value]="localCalcs().rangeMax"
              aria-label="Highest value"
              (input)="updateCalc('rangeMax', $event)" />
            <span class="op sub-label">(max)</span>
            <span class="op">−</span>
            <input class="blank-input" type="text" inputmode="decimal"
              [value]="localCalcs().rangeMin"
              aria-label="Lowest value"
              (input)="updateCalc('rangeMin', $event)" />
            <span class="op sub-label">(min)</span>
            <span class="op">=</span>
            <input class="blank-input result" type="text" inputmode="decimal"
              [value]="localCalcs().rangeResult"
              aria-label="Range result"
              (input)="updateCalc('rangeResult', $event)" />
          </div>
        </section>

        <!-- EXAMPLE: Standard Deviation -->
        <section class="calc-section">
          <h4><mat-icon>show_chart</mat-icon> Standard Deviation &amp; Variance <span class="level-label">(State/Nationals only)</span></h4>
          @if (showHints()) {
            <p class="instruction">Shows how spread out your trial data is from the mean. Divide the sum of squared deviations by <strong>n − 1</strong> (one less than the number of trials) to get the sample variance.</p>
          }
          <div class="equation">
            <span class="label">Mean (x̄) =</span>
            <input class="blank-input" type="text" inputmode="decimal"
              [value]="localCalcs().stddevMean"
              aria-label="Mean for standard deviation"
              (input)="updateCalc('stddevMean', $event)" />
          </div>
          <table class="work-table" aria-label="Standard deviation work table">
            <thead>
              <tr>
                <th>Trial Value (x)</th>
                <th>x − x̄</th>
                <th>(x − x̄)²</th>
              </tr>
            </thead>
            <tbody>
              @for (row of effectiveStddevRows(); track $index) {
                <tr>
                  <td><input class="blank-input" type="text" inputmode="decimal"
                    [value]="row.value" [attr.aria-label]="'Value ' + ($index + 1)"
                    (input)="updateStddevRow($index, 'value', $event)" /></td>
                  <td><input class="blank-input" type="text" inputmode="decimal"
                    [value]="row.deviation" [attr.aria-label]="'Deviation ' + ($index + 1)"
                    (input)="updateStddevRow($index, 'deviation', $event)" /></td>
                  <td><input class="blank-input" type="text" inputmode="decimal"
                    [value]="row.squared" [attr.aria-label]="'Squared deviation ' + ($index + 1)"
                    (input)="updateStddevRow($index, 'squared', $event)" /></td>
                </tr>
              }
            </tbody>
          </table>
          <div class="equation">
            <span class="label">Σ(x − x̄)² =</span>
            <input class="blank-input" type="text" inputmode="decimal"
              [value]="localCalcs().stddevSum"
              aria-label="Sum of squared deviations"
              (input)="updateCalc('stddevSum', $event)" />
          </div>
          <div class="equation">
            <span class="label">Variance =</span>
            <input class="blank-input" type="text" inputmode="decimal"
              [value]="localCalcs().stddevSum" aria-label="Sum" readonly tabindex="-1" />
            <span class="op">÷</span>
            <input class="blank-input sm" type="text" inputmode="numeric"
              [value]="localCalcs().stddevDivisor"
              aria-label="n minus 1"
              (input)="updateCalc('stddevDivisor', $event)" />
            <span class="op sub-label">(n − 1)</span>
            <span class="op">=</span>
            <input class="blank-input result" type="text" inputmode="decimal"
              [value]="localCalcs().stddevVariance"
              aria-label="Variance"
              (input)="updateCalc('stddevVariance', $event)" />
          </div>
          <div class="equation">
            <span class="label">Std Dev = √</span>
            <input class="blank-input" type="text" inputmode="decimal"
              [value]="localCalcs().stddevVariance" aria-label="Variance" readonly tabindex="-1" />
            <span class="op">=</span>
            <input class="blank-input result" type="text" inputmode="decimal"
              [value]="localCalcs().stddevResult"
              aria-label="Standard deviation result"
              (input)="updateCalc('stddevResult', $event)" />
          </div>
        </section>

        <!-- EXAMPLE: Q1 & Q3 -->
        <section class="calc-section">
          <h4><mat-icon>vertical_align_center</mat-icon> Quartiles (Q1 & Q3)</h4>
          @if (showHints()) {
            <p class="instruction">Use your sorted trial values. Q1 is the median of the lower half; Q3 is the median of the upper half.</p>
          }
          <div class="equation">
            <span class="label">Q1 =</span>
            <input class="blank-input result" type="text" inputmode="decimal"
              [value]="localCalcs().q1Result"
              aria-label="Q1 result"
              (input)="updateCalc('q1Result', $event)" />
            <span class="spacer"></span>
            <span class="label">Q3 =</span>
            <input class="blank-input result" type="text" inputmode="decimal"
              [value]="localCalcs().q3Result"
              aria-label="Q3 result"
              (input)="updateCalc('q3Result', $event)" />
          </div>
        </section>

        <!-- EXAMPLE: IQR -->
        <section class="calc-section">
          <h4><mat-icon>compress</mat-icon> Interquartile Range (IQR)</h4>
          @if (showHints()) {
            <p class="instruction">Subtract Q1 from Q3.</p>
          }
          <div class="equation" role="math" aria-label="IQR calculation">
            <input class="blank-input" type="text" inputmode="decimal"
              [value]="localCalcs().iqrQ3"
              aria-label="Q3"
              (input)="updateCalc('iqrQ3', $event)" />
            <span class="op sub-label">(Q3)</span>
            <span class="op">−</span>
            <input class="blank-input" type="text" inputmode="decimal"
              [value]="localCalcs().iqrQ1"
              aria-label="Q1"
              (input)="updateCalc('iqrQ1', $event)" />
            <span class="op sub-label">(Q1)</span>
            <span class="op">=</span>
            <input class="blank-input result" type="text" inputmode="decimal"
              [value]="localCalcs().iqrResult"
              aria-label="IQR result"
              (input)="updateCalc('iqrResult', $event)" />
          </div>
        </section>

      }

      <!-- Statistics Notes (always shown) -->
      <h3><mat-icon>note</mat-icon> Additional Notes</h3>
      @if (showHints()) {
        <p class="hint">Any additional observations about your statistics (optional).</p>
      }
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Statistics Notes</mat-label>
        <textarea matInput rows="4"
          [ngModel]="statisticsNotes()"
          (ngModelChange)="changed.emit({ statisticsNotes: $event })"
          [placeholder]="showHints() ? 'e.g., The standard deviation increases at higher IV levels, suggesting more variability...' : ''"
        ></textarea>
      </mat-form-field>
    </div>
  `,
  styles: `
    .step-content { max-width: 960px; }
    .full-width { width: 100%; }

    .instruction { color: #666; font-size: 14px; margin: 0 0 8px; }

    h3 { display: flex; align-items: center; gap: 8px; margin: 24px 0 8px; font-weight: 500; }
    .group-heading {
      margin-top: 32px;
      padding: 8px 0;
      border-bottom: 2px solid #1565c0;
      color: #1565c0;
      font-size: 18px;
    }
    .level-label {
      font-size: 12px;
      font-weight: 400;
      color: #1565c0;
      font-style: italic;
    }
    h4 { display: flex; align-items: center; gap: 8px; margin: 0 0 4px; font-weight: 500; font-size: 16px; }
    .hint { color: #666; font-size: 14px; margin: 0 0 12px; }
    .example-label { font-size: 14px; font-weight: 400; color: #1565c0; }

    /* Summary table */
    .table-wrapper {
      overflow-x: auto;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .summary-table {
      width: 100%;
      border-collapse: collapse;
    }
    .summary-table th {
      background: #f5f5f5;
      padding: 10px 8px;
      text-align: center;
      font-weight: 500;
      font-size: 13px;
      border-bottom: 2px solid #e0e0e0;
      white-space: nowrap;
    }
    .summary-table td {
      padding: 8px 6px;
      text-align: center;
      border-bottom: 1px solid #f0f0f0;
      font-size: 14px;
    }
    .summary-table .iv-cell {
      font-weight: 500;
      color: #333;
      background: #fafafa;
    }
    .summary-table.manual td { padding: 4px 3px; }
    .cell-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
    }
    .cell-input {
      width: 64px;
      padding: 5px 4px;
      border: 1px solid transparent;
      border-bottom: 2px solid #1565c0;
      border-radius: 3px 3px 0 0;
      font-size: 13px;
      text-align: center;
      background: transparent;
      transition: border-color 0.2s;
    }
    .cell-input:focus { border-color: #1565c0; outline: none; background: #f5f9ff; }
    .cell-input.correct { border-bottom-color: #2e7d32; background: #e8f5e9; }
    .cell-input.incorrect { border-bottom-color: #c62828; background: #ffebee; }
    .validation-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      position: absolute;
      right: -18px;
      top: 50%;
      transform: translateY(-50%);
    }
    .validation-icon.correct { color: #2e7d32; }
    .validation-icon.incorrect { color: #c62828; }

    /* Auto-calc mode (unused, kept for future) */
    .info-card mat-card-content { display: flex; align-items: center; gap: 8px; padding: 16px; color: #666; }

    /* Manual mode */
    .calc-section {
      background: #fafafa;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 16px;
      border-left: 3px solid #1565c0;
    }
    .instruction { color: #555; font-size: 13px; margin: 2px 0 10px; }
    .instruction.sub { color: #777; font-size: 12px; font-style: italic; margin: 8px 0 6px; }

    .equation {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 16px;
      margin: 8px 0;
    }
    .equation.compact { margin: 4px 0; }
    .equation.final-eq {
      margin-top: 12px;
      padding: 8px 12px;
      background: #e8eaf6;
      border-radius: 6px;
      font-weight: 500;
    }

    .op { color: #333; font-weight: 500; }
    .label { color: #333; font-weight: 500; white-space: nowrap; }
    .sub-label { font-size: 11px; color: #595959; font-weight: 400; }
    .spacer { width: 24px; }

    .blank-input {
      width: 64px;
      height: 28px;
      text-align: center;
      border: none;
      border-bottom: 2px solid #1565c0;
      font-size: 15px;
      background: transparent;
      padding: 0 4px;
      font-family: 'Roboto Mono', monospace;
      transition: border-color 0.2s, background 0.2s;
    }
    .blank-input:focus { border-bottom-color: #0d47a1; outline: none; background: #e3f2fd; }
    .blank-input[readonly] { border-bottom-style: dashed; color: #888; cursor: default; }
    .blank-input.sm { width: 44px; }
    .blank-input.wide { width: 100px; }
    .blank-input.result { border-bottom-color: #2e7d32; font-weight: 600; }
    .blank-input.result:focus { background: #e8f5e9; border-bottom-color: #1b5e20; }

    .sums-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin: 8px 0;
    }

    .work-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 14px;
    }
    .work-table th {
      background: #e8eaf6;
      padding: 6px 8px;
      text-align: center;
      font-weight: 500;
      font-size: 13px;
    }
    .work-table td { padding: 4px; text-align: center; }
    .work-table .blank-input { width: 80px; }

    .check-section { margin: 24px 0 16px; }
  `,
})
export class StatisticsStepComponent implements OnInit {
  readonly dataTable = input<DataTableEntry[]>([]);
  readonly numTrials = input(5);
  readonly statisticsNotes = input('');
  readonly manualCalculations = input<ManualCalculations | undefined>();
  readonly showHints = input(true);
  readonly allowCheckMyWork = input(true);
  readonly changed = output<Partial<ReportSubmission>>();

  protected readonly localCalcs = signal<ManualCalculations>(createBlankManualCalcs(4));
  protected readonly showValidation = signal(false);
  protected readonly summaryFields: (keyof StatsSummaryRow)[] = [
    'mean', 'median', 'mode', 'range', 'iqr', 'stddev', 'variance',
  ];

  protected readonly numRows = computed(() => this.dataTable().length);
  protected readonly ivLabel = computed(() => {
    const table = this.dataTable();
    return table.length > 0 && table[0].ivValue ? 'IV Level' : 'Level';
  });

  /** Effective number of active trial columns */
  protected readonly activeTrials = computed(() => {
    const n = this.numTrials();
    return n >= 3 && n <= 5 ? n : 5;
  });

  protected readonly exampleIvLabel = computed(() => {
    const row = this.dataTable()[this.localCalcs().exampleIvIndex];
    return row?.ivValue || 'Row 1';
  });

  private static readonly TRIAL_KEYS = ['trial1', 'trial2', 'trial3', 'trial4', 'trial5'] as const;

  /** Get trial values for a specific row as numbers (only active columns) */
  private getTrialValues(rowIndex: number): number[] {
    const row = this.dataTable()[rowIndex];
    if (!row) return [];
    return StatisticsStepComponent.TRIAL_KEYS
      .slice(0, this.activeTrials())
      .map((k) => row[k])
      .filter((v): v is number => v !== null && !isNaN(v as number));
  }

  /** Auto-calculate stats for one IV row (used in auto mode + check answers) */
  protected autoRowStats(index: number): {
    mean: string; median: string; mode: string; range: string;
    iqr: string; stddev: string; variance: string;
  } {
    const vals = this.getTrialValues(index);
    if (vals.length === 0) {
      return { mean: '—', median: '—', mode: '—', range: '—', iqr: '—', stddev: '—', variance: '—' };
    }
    const s = stats.computeAll(vals);
    return {
      mean: String(s.mean),
      median: String(s.median),
      mode: s.mode.length ? s.mode.join(', ') : 'None',
      range: String(s.range),
      iqr: String(s.iqr),
      stddev: String(s.stddev),
      variance: String(stats.round(stats.variance(vals), 4)),
    };
  }

  /** Summary table row accessor (pads if needed) */
  protected summaryRow(index: number): StatsSummaryRow {
    const table = this.localCalcs().summaryTable;
    return table[index] ?? { mean: '', median: '', mode: '', range: '', iqr: '', stddev: '', variance: '' };
  }

  /** Compare student's value to the correct auto-calculated value */
  protected isCellCorrect(rowIndex: number, field: keyof StatsSummaryRow): boolean {
    const student = this.summaryRow(rowIndex)[field].trim();
    if (!student) return false;
    const correct = this.autoRowStats(rowIndex)[field];
    if (correct === '—') return false;
    // For mode, compare normalized strings (case-insensitive, whitespace-trimmed)
    if (field === 'mode') {
      return student.toLowerCase().replace(/\s/g, '') === correct.toLowerCase().replace(/\s/g, '');
    }
    // For numeric fields, compare as numbers with small tolerance
    const studentNum = parseFloat(student);
    const correctNum = parseFloat(correct);
    if (isNaN(studentNum) || isNaN(correctNum)) return student === correct;
    return Math.abs(studentNum - correctNum) < 0.015;
  }

  protected readonly effectiveMeanValues = computed(() =>
    padArray(this.localCalcs().meanValues, this.activeTrials())
  );

  protected readonly effectiveMedianSorted = computed(() =>
    padArray(this.localCalcs().medianSorted, this.activeTrials())
  );

  protected readonly effectiveStddevRows = computed(() => {
    const stored = this.localCalcs().stddevRows;
    const n = this.activeTrials();
    const result = stored.map((r) => ({ ...r }));
    while (result.length < n) result.push({ value: '', deviation: '', squared: '' });
    return result.slice(0, n);
  });

  ngOnInit(): void {
    const calcs = { ...(this.manualCalculations() ?? createBlankManualCalcs(this.numRows(), this.activeTrials())) };
    // Backfill summaryTable for drafts saved before this field existed
    if (!calcs.summaryTable) {
      calcs.summaryTable = [];
    }
    while (calcs.summaryTable.length < this.numRows()) {
      calcs.summaryTable.push({ mean: '', median: '', mode: '', range: '', iqr: '', stddev: '', variance: '' });
    }
    this.localCalcs.set(calcs);
  }

  protected checkSummaryTable(): void {
    this.showValidation.set(true);
  }

  protected updateSummary(index: number, field: keyof StatsSummaryRow, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const table = this.localCalcs().summaryTable.map((r) => ({ ...r }));
    table[index] = { ...table[index], [field]: value };
    this.localCalcs.update((c) => ({ ...c, summaryTable: table }));
    this.showValidation.set(false);
    this.emitChanges();
  }

  protected updateCalc(field: keyof ManualCalculations, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.localCalcs.update((c) => ({ ...c, [field]: value }));
    this.emitChanges();
  }

  protected updateMeanValue(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const arr = [...this.effectiveMeanValues()];
    arr[index] = value;
    this.localCalcs.update((c) => ({ ...c, meanValues: arr }));
    this.emitChanges();
  }

  protected updateMedianSorted(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const arr = [...this.effectiveMedianSorted()];
    arr[index] = value;
    this.localCalcs.update((c) => ({ ...c, medianSorted: arr }));
    this.emitChanges();
  }

  protected updateStddevRow(index: number, field: keyof StdDevWorkRow, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const rows = this.effectiveStddevRows().map((r) => ({ ...r }));
    rows[index] = { ...rows[index], [field]: value };
    this.localCalcs.update((c) => ({ ...c, stddevRows: rows }));
    this.emitChanges();
  }

  private emitChanges(): void {
    this.changed.emit({ manualCalculations: this.localCalcs() });
  }
}

function padArray(arr: string[], length: number): string[] {
  const result = [...arr];
  while (result.length < length) result.push('');
  return result.slice(0, length);
}
