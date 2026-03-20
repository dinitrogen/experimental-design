import { ChangeDetectionStrategy, Component, input, output, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReportSubmission, DataTableEntry, GraphData, GraphPoint, BarPoint, ManualCalculations, createBlankManualCalcs } from '../../../../core/models/submission.model';
import { GraphCanvasComponent } from '../../../../shared/components/graph-canvas';

const DEFAULT_GRAPH: GraphData = {
  title: '', xAxisLabel: '', yAxisLabel: '',
  xMin: 0, xMax: 10, yMin: 0, yMax: 10,
  points: [], lobfStart: null, lobfEnd: null,
  chartType: 'scatter',
};

function niceInterval(range: number, targetTicks = 8): number {
  if (range <= 0) return 1;
  const rough = range / targetTicks;
  const p = Math.pow(10, Math.floor(Math.log10(rough)));
  const f = rough / p;
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
}

@Component({
  selector: 'app-step-graph',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, MatFormFieldModule, MatInputModule, MatIconModule,
    MatCardModule, MatButtonModule, MatButtonToggleModule, MatTooltipModule,
    GraphCanvasComponent,
  ],
  template: `
    <div class="step-content">
      <h3>
        <mat-icon>show_chart</mat-icon>
        Graph
      </h3>

      @if (showHints()) {
        <mat-card class="info-card">
          <mat-card-content>
            <p><strong>Graphing checklist:</strong></p>
            <ul>
              <li>Add a descriptive title</li>
              <li>Label both axes with variable name and units</li>
              @if (localGraph().chartType !== 'bar') {
                <li>Choose appropriate axis scales that fit your data</li>
              }
              <li>Plot the mean of each IV level</li>
              @if (localGraph().chartType !== 'bar') {
                <li>Draw a Line of Best Fit through your data points</li>
              }
            </ul>
          </mat-card-content>
        </mat-card>
      }

      <!-- Labels -->
      <div class="labels-row">
        <mat-form-field appearance="outline" class="title-field">
          <mat-label>Graph Title</mat-label>
          <input matInput [ngModel]="localGraph().title"
            (ngModelChange)="updateField('title', $event)"
            [placeholder]="showHints() ? 'e.g., Effect of Drop Height on Fall Time' : ''" />
        </mat-form-field>
      </div>
      <div class="labels-row">
        <mat-form-field appearance="outline" class="axis-field">
          <mat-label>X-Axis Label (IV)</mat-label>
          <input matInput [ngModel]="localGraph().xAxisLabel"
            (ngModelChange)="updateField('xAxisLabel', $event)" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="axis-field">
          <mat-label>Y-Axis Label (DV)</mat-label>
          <input matInput [ngModel]="localGraph().yAxisLabel"
            (ngModelChange)="updateField('yAxisLabel', $event)" />
        </mat-form-field>
      </div>

      <!-- Axis Ranges -->
      <div class="range-row">
        @if (localGraph().chartType !== 'bar') {
          <mat-form-field appearance="outline" class="range-field">
            <mat-label>X Min</mat-label>
            <input matInput type="number" [ngModel]="localGraph().xMin"
              (ngModelChange)="updateField('xMin', +$event)" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="range-field">
            <mat-label>X Max</mat-label>
            <input matInput type="number" [ngModel]="localGraph().xMax"
              (ngModelChange)="updateField('xMax', +$event)" />
          </mat-form-field>
        }
        <mat-form-field appearance="outline" class="range-field">
          <mat-label>Y Min</mat-label>
          <input matInput type="number" [ngModel]="localGraph().yMin"
            (ngModelChange)="updateField('yMin', +$event)" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="range-field">
          <mat-label>Y Max</mat-label>
          <input matInput type="number" [ngModel]="localGraph().yMax"
            (ngModelChange)="updateField('yMax', +$event)" />
        </mat-form-field>
        <button mat-stroked-button (click)="autoSuggestRanges()"
          matTooltip="Auto-suggest ranges from your data">
          <mat-icon>auto_fix_high</mat-icon> Auto
        </button>
      </div>

      <!-- Chart Type -->
      <div class="controls-row">
        <mat-button-toggle-group [value]="localGraph().chartType || 'scatter'" (change)="setChartType($event.value)" hideSingleSelectionIndicator>
          <mat-button-toggle value="scatter">
            <mat-icon>scatter_plot</mat-icon> Scatter Plot
          </mat-button-toggle>
          <mat-button-toggle value="bar">
            <mat-icon>bar_chart</mat-icon> Bar Chart
          </mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      <!-- Controls -->
      <div class="controls-row">
        @if (localGraph().chartType !== 'bar') {
          <mat-button-toggle-group [value]="plotMode()" (change)="setMode($event.value)" hideSingleSelectionIndicator>
            <mat-button-toggle value="plot">
              <mat-icon>add_location</mat-icon> Plot Points
            </mat-button-toggle>
            <mat-button-toggle value="lobf">
              <mat-icon>timeline</mat-icon> Draw LOBF
            </mat-button-toggle>
          </mat-button-toggle-group>
        }
        @if (localGraph().chartType === 'bar') {
          <button mat-stroked-button (click)="plotFromData()"
            matTooltip="Plot bars from your data table means">
            <mat-icon>auto_graph</mat-icon> Plot from Data
          </button>
        }
        <button mat-stroked-button (click)="undoPoint()" [disabled]="itemCount() === 0">
          <mat-icon>undo</mat-icon> Undo
        </button>
        <button mat-stroked-button (click)="clearPoints()" [disabled]="itemCount() === 0">
          Clear
        </button>
        @if (localGraph().chartType !== 'bar' && localGraph().lobfStart) {
          <button mat-stroked-button (click)="removeLobf()">Remove LOBF</button>
        }
      </div>

      @if (localGraph().chartType !== 'bar' && plotMode() === 'lobf') {
        <p class="mode-hint" role="status">
          @if (!lobfFirstPoint()) {
            Click on the graph to set the <strong>first</strong> LOBF endpoint.
          } @else {
            Click to set the <strong>second</strong> endpoint.
          }
        </p>
      }

      <app-graph-canvas
        [graphData]="localGraph()"
        [lobfPending]="lobfFirstPoint()"
        (canvasClicked)="onCanvasClick($event)"
      />

      @if (dataTable().length > 0) {
        <mat-card class="ref-card">
          <mat-card-content>
            <strong>Your Data (for reference):</strong>
            <div class="ref-table">
              @for (row of dataTable(); track $index) {
                <span class="ref-item">
                  ({{ row.ivValue || '\u2014' }}, {{ row.mean != null ? row.mean : '\u2014' }})
                </span>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- LOBF Calculation (scatter plot only) -->
      @if (localGraph().chartType !== 'bar' && localGraph().lobfStart && localGraph().lobfEnd) {
        <h3 class="lobf-heading"><mat-icon>timeline</mat-icon> Line of Best Fit Calculation</h3>
        @if (showHints()) {
          <p class="hint">
            Use the two endpoints from your LOBF to calculate slope (rise over run)
            and the y-intercept.
          </p>
        }
        <section class="calc-section">
          <h4>Slope (m) — Rise over Run</h4>
          @if (showHints()) {
            <p class="instruction">Your LOBF endpoints from the graph above.</p>
          }
          <div class="equation">
            <span class="label">Point 1: (</span>
            <input class="blank-input sm" type="text" inputmode="decimal"
              [value]="localCalcs().lobfX1" aria-label="x1"
              (input)="updateLobfCalc('lobfX1', $event)" />
            <span class="op">,</span>
            <input class="blank-input sm" type="text" inputmode="decimal"
              [value]="localCalcs().lobfY1" aria-label="y1"
              (input)="updateLobfCalc('lobfY1', $event)" />
            <span class="label">)</span>
            <span class="spacer"></span>
            <span class="label">Point 2: (</span>
            <input class="blank-input sm" type="text" inputmode="decimal"
              [value]="localCalcs().lobfX2" aria-label="x2"
              (input)="updateLobfCalc('lobfX2', $event)" />
            <span class="op">,</span>
            <input class="blank-input sm" type="text" inputmode="decimal"
              [value]="localCalcs().lobfY2" aria-label="y2"
              (input)="updateLobfCalc('lobfY2', $event)" />
            <span class="label">)</span>
          </div>
          @if (showHints()) {
            <p class="instruction">Substitute into the formula: m = (y₂ − y₁) / (x₂ − x₁)</p>
          }
          <div class="equation" role="math" aria-label="Slope calculation">
            <span class="label">m =</span>
            <span class="op">(</span>
            <input class="blank-input sm" type="text" inputmode="decimal"
              [value]="localCalcs().lobfY2" aria-label="y2 value" readonly tabindex="-1" />
            <span class="op">−</span>
            <input class="blank-input sm" type="text" inputmode="decimal"
              [value]="localCalcs().lobfY1" aria-label="y1 value" readonly tabindex="-1" />
            <span class="op">) / (</span>
            <input class="blank-input sm" type="text" inputmode="decimal"
              [value]="localCalcs().lobfX2" aria-label="x2 value" readonly tabindex="-1" />
            <span class="op">−</span>
            <input class="blank-input sm" type="text" inputmode="decimal"
              [value]="localCalcs().lobfX1" aria-label="x1 value" readonly tabindex="-1" />
            <span class="op">) =</span>
            <input class="blank-input result" type="text" inputmode="decimal"
              [value]="localCalcs().lobfSlope" aria-label="Slope m"
              (input)="updateLobfCalc('lobfSlope', $event)" />
          </div>
        </section>

        <section class="calc-section">
          <h4>Y-intercept (b)</h4>
          @if (showHints()) {
            <p class="instruction">Plug a point and your slope into b = y − m × x.</p>
          }
          <div class="equation" role="math" aria-label="Intercept calculation">
            <span class="label">b =</span>
            <input class="blank-input sm" type="text" inputmode="decimal"
              [value]="localCalcs().lobfIntY" aria-label="y value"
              (input)="updateLobfCalc('lobfIntY', $event)" />
            <span class="op">−</span>
            <input class="blank-input sm" type="text" inputmode="decimal"
              [value]="localCalcs().lobfIntM" aria-label="slope m"
              (input)="updateLobfCalc('lobfIntM', $event)" />
            <span class="op">×</span>
            <input class="blank-input sm" type="text" inputmode="decimal"
              [value]="localCalcs().lobfIntX" aria-label="x value"
              (input)="updateLobfCalc('lobfIntX', $event)" />
            <span class="op">=</span>
            <input class="blank-input result" type="text" inputmode="decimal"
              [value]="localCalcs().lobfIntercept" aria-label="Intercept b"
              (input)="updateLobfCalc('lobfIntercept', $event)" />
          </div>
        </section>

        <!-- LOBF FINAL EQUATION -->
        <div class="lobf-equation-row">
          <span class="lobf-eq-label">LOBF: y =</span>
          <div class="cell-wrapper">
            <input class="blank-input lobf-blank" type="text" inputmode="decimal"
              [value]="localCalcs().lobfSlope"
              (input)="updateLobfCalc('lobfSlope', $event)"
              [class.correct]="allowCheckMyWork() && showLobfCheck() && isLobfSlopeCorrect()"
              [class.incorrect]="allowCheckMyWork() && showLobfCheck() && !isLobfSlopeCorrect() && localCalcs().lobfSlope !== ''"
              aria-label="Slope m for equation" />
            @if (allowCheckMyWork() && showLobfCheck() && localCalcs().lobfSlope !== '') {
              <mat-icon class="validation-icon" [class.correct]="isLobfSlopeCorrect()" [class.incorrect]="!isLobfSlopeCorrect()">
                {{ isLobfSlopeCorrect() ? 'check_circle' : 'cancel' }}
              </mat-icon>
            }
          </div>
          <span class="lobf-eq-label">x +</span>
          <div class="cell-wrapper">
            <input class="blank-input lobf-blank" type="text" inputmode="decimal"
              [value]="localCalcs().lobfIntercept"
              (input)="updateLobfCalc('lobfIntercept', $event)"
              [class.correct]="allowCheckMyWork() && showLobfCheck() && isLobfInterceptCorrect()"
              [class.incorrect]="allowCheckMyWork() && showLobfCheck() && !isLobfInterceptCorrect() && localCalcs().lobfIntercept !== ''"
              aria-label="Intercept b for equation" />
            @if (allowCheckMyWork() && showLobfCheck() && localCalcs().lobfIntercept !== '') {
              <mat-icon class="validation-icon" [class.correct]="isLobfInterceptCorrect()" [class.incorrect]="!isLobfInterceptCorrect()">
                {{ isLobfInterceptCorrect() ? 'check_circle' : 'cancel' }}
              </mat-icon>
            }
          </div>
        </div>
        @if (allowCheckMyWork()) {
          <div class="check-section">
            <button mat-stroked-button (click)="checkLobf()">
              <mat-icon>check_circle</mat-icon>
              Check My Calculations
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: `
    .step-content { max-width: 760px; }
    h3 { display: flex; align-items: center; gap: 8px; margin: 8px 0 4px; font-weight: 500; }
    .info-card { margin: 12px 0 16px; background: #fff8e1; }
    .info-card p { margin: 0 0 8px; }
    .info-card ul { margin: 0; padding-left: 20px; }
    .info-card li { line-height: 1.6; }

    .labels-row { display: flex; gap: 12px; flex-wrap: wrap; }
    .title-field { flex: 1; min-width: 280px; }
    .axis-field { flex: 1; min-width: 200px; }

    .range-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .range-field { width: 100px; }

    .controls-row {
      display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
      margin-bottom: 12px;
    }

    .mode-hint { font-size: 13px; color: #e65100; margin: 0 0 8px; }

    .ref-card { margin-top: 16px; background: #f5f5f5; }
    .ref-table { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 8px; }
    .ref-item { font-family: monospace; font-size: 14px; }

    /* LOBF Calculation */
    .lobf-heading {
      margin-top: 32px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }
    .hint { color: #666; font-size: 14px; margin: 0 0 12px; }
    .calc-section {
      background: #fafafa;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 16px;
      border-left: 3px solid #1565c0;
    }
    .calc-section h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 4px;
      font-weight: 500;
      font-size: 16px;
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
    .label { color: #333; font-weight: 500; white-space: nowrap; }
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
    .blank-input:focus { border-bottom-color: var(--primary-dark); outline: none; background: color-mix(in srgb, var(--primary-color) 12%, transparent); }
    .blank-input[readonly] { border-bottom-style: dashed; color: #888; cursor: default; }
    .blank-input.sm { width: 44px; }
    .blank-input.result { border-bottom-color: #2e7d32; font-weight: 600; }
    .blank-input.result:focus { background: #e8f5e9; border-bottom-color: #1b5e20; }
    .cell-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
    }
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
    .lobf-equation-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      padding: 12px 16px;
      background: #e8eaf6;
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .lobf-equation-row .cell-wrapper { margin-right: 20px; }
    .lobf-eq-label { font-size: 18px; font-weight: 500; color: #333; }
    .blank-input.lobf-blank { width: 80px; font-size: 16px; font-weight: 600; }
    .blank-input.lobf-blank.correct { border-bottom-color: #2e7d32; background: #e8f5e9; }
    .blank-input.lobf-blank.incorrect { border-bottom-color: #c62828; background: #ffebee; }
    .check-section { margin: 24px 0 16px; }
  `,
})
export class GraphStepComponent implements OnInit {
  readonly graphData = input<GraphData | undefined>();
  readonly dataTable = input<DataTableEntry[]>([]);
  readonly independentVar = input('');
  readonly dependentVar = input('');
  readonly showHints = input(true);
  readonly manualCalculations = input<ManualCalculations | undefined>();
  readonly allowCheckMyWork = input(true);

  readonly changed = output<Partial<ReportSubmission>>();

  protected readonly localGraph = signal<GraphData>({ ...DEFAULT_GRAPH });
  protected readonly localCalcs = signal<ManualCalculations>(createBlankManualCalcs(0));
  protected readonly plotMode = signal<'plot' | 'lobf'>('plot');
  protected readonly lobfFirstPoint = signal<GraphPoint | null>(null);
  protected readonly showLobfCheck = signal(false);
  protected readonly itemCount = computed(() => {
    const g = this.localGraph();
    return g.chartType === 'bar' ? (g.bars?.length ?? 0) : g.points.length;
  });

  ngOnInit(): void {
    const existing = this.graphData();
    if (existing) {
      this.localGraph.set({
        ...existing,
        points: [...(existing.points ?? [])],
        bars: existing.bars ? [...existing.bars] : [],
      });
    } else {
      this.localGraph.set({
        ...DEFAULT_GRAPH,
        xAxisLabel: this.independentVar(),
        yAxisLabel: this.dependentVar(),
      });
    }

    const calcs = this.manualCalculations();
    if (calcs) {
      this.localCalcs.set({ ...calcs });
    }
  }

  protected updateField(field: string, value: string | number): void {
    this.localGraph.update(g => ({ ...g, [field]: value }));
    this.emit();
  }

  protected setMode(mode: 'plot' | 'lobf'): void {
    this.plotMode.set(mode);
    this.lobfFirstPoint.set(null);
  }

  protected setChartType(type: 'scatter' | 'bar'): void {
    this.localGraph.update(g => ({
      ...g,
      chartType: type,
      lobfStart: type === 'bar' ? null : g.lobfStart,
      lobfEnd: type === 'bar' ? null : g.lobfEnd,
      // Clear the other chart type's data
      points: type === 'bar' ? [] : g.points,
      bars: type === 'bar' ? (g.bars ?? []) : [],
    }));
    this.lobfFirstPoint.set(null);
    if (type === 'bar') this.plotMode.set('plot');
    this.emit();
  }

  protected plotFromData(): void {
    const barData: BarPoint[] = [];
    for (const row of this.dataTable()) {
      if (row.ivValue && row.mean != null) {
        barData.push({ label: row.ivValue, y: row.mean });
      }
    }
    if (barData.length === 0) return;
    this.localGraph.update(g => ({ ...g, bars: barData }));
    this.autoSuggestRanges();
  }

  protected onCanvasClick(point: GraphPoint): void {
    // Bar charts are populated via "Plot from Data", not canvas clicks
    if (this.localGraph().chartType === 'bar') return;

    if (this.plotMode() === 'plot') {
      this.localGraph.update(g => ({ ...g, points: [...g.points, point] }));
      this.emit();
    } else {
      const first = this.lobfFirstPoint();
      if (!first) {
        this.lobfFirstPoint.set(point);
      } else {
        this.localGraph.update(g => ({ ...g, lobfStart: first, lobfEnd: point }));
        this.lobfFirstPoint.set(null);
        this.plotMode.set('plot');
        this.emit();
      }
    }
  }

  protected undoPoint(): void {
    if (this.localGraph().chartType === 'bar') {
      this.localGraph.update(g => ({ ...g, bars: (g.bars ?? []).slice(0, -1) }));
    } else {
      this.localGraph.update(g => ({ ...g, points: g.points.slice(0, -1) }));
    }
    this.emit();
  }

  protected clearPoints(): void {
    if (this.localGraph().chartType === 'bar') {
      this.localGraph.update(g => ({ ...g, bars: [] }));
    } else {
      this.localGraph.update(g => ({ ...g, points: [] }));
    }
    this.emit();
  }

  protected removeLobf(): void {
    this.localGraph.update(g => ({ ...g, lobfStart: null, lobfEnd: null }));
    this.lobfFirstPoint.set(null);
    this.emit();
  }

  protected autoSuggestRanges(): void {
    const isBar = this.localGraph().chartType === 'bar';
    const xValues: number[] = [];
    const yValues: number[] = [];
    for (const row of this.dataTable()) {
      if (!isBar) {
        const x = parseFloat(row.ivValue);
        if (!isNaN(x)) xValues.push(x);
      }
      if (row.mean != null) yValues.push(row.mean);
    }
    const suggest = (vals: number[]): { min: number; max: number } => {
      if (vals.length === 0) return { min: 0, max: 10 };
      const maxV = Math.max(...vals);
      const minV = Math.min(...vals);
      const range = maxV - minV || maxV || 1;
      const step = niceInterval(range);
      return {
        min: minV >= 0 ? 0 : Math.floor(minV / step) * step,
        max: Math.ceil(maxV * 1.1 / step) * step || step,
      };
    };
    const yR = suggest(yValues);
    if (isBar) {
      this.localGraph.update(g => ({ ...g, yMin: yR.min, yMax: yR.max }));
    } else {
      const xR = suggest(xValues);
      this.localGraph.update(g => ({ ...g, xMin: xR.min, xMax: xR.max, yMin: yR.min, yMax: yR.max }));
    }
    this.emit();
  }

  protected updateLobfCalc(field: keyof ManualCalculations, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.localCalcs.update((c) => ({ ...c, [field]: value }));
    this.showLobfCheck.set(false);
    this.changed.emit({ manualCalculations: this.localCalcs() });
  }

  protected checkLobf(): void {
    this.showLobfCheck.set(true);
  }

  protected isLobfSlopeCorrect(): boolean {
    const c = this.localCalcs();
    const y2 = parseFloat(c.lobfY2);
    const y1 = parseFloat(c.lobfY1);
    const x2 = parseFloat(c.lobfX2);
    const x1 = parseFloat(c.lobfX1);
    const student = parseFloat(c.lobfSlope);
    if ([y2, y1, x2, x1, student].some(isNaN)) return false;
    if (x2 === x1) return false;
    const expected = (y2 - y1) / (x2 - x1);
    return Math.abs(student - expected) < 0.05;
  }

  protected isLobfInterceptCorrect(): boolean {
    const c = this.localCalcs();
    const student = parseFloat(c.lobfIntercept);
    const m = parseFloat(c.lobfSlope);
    const x1 = parseFloat(c.lobfX1);
    const y1 = parseFloat(c.lobfY1);
    const x2 = parseFloat(c.lobfX2);
    const y2 = parseFloat(c.lobfY2);
    if (isNaN(student) || isNaN(m)) return false;

    const candidates: number[] = [];
    if (!isNaN(x1) && !isNaN(y1)) candidates.push(y1 - m * x1);
    if (!isNaN(x2) && !isNaN(y2)) candidates.push(y2 - m * x2);
    const intY = parseFloat(c.lobfIntY);
    const intM = parseFloat(c.lobfIntM);
    const intX = parseFloat(c.lobfIntX);
    if (!isNaN(intY) && !isNaN(intM) && !isNaN(intX)) candidates.push(intY - intM * intX);
    if (candidates.length === 0) return false;
    return candidates.some(exp => Math.abs(student - exp) < 0.1);
  }

  private emit(): void {
    this.changed.emit({ graphData: this.localGraph() });
  }
}
