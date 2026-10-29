import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MarkdownComponent } from 'ngx-markdown';
import { TaskService } from '../../core/services/task.service';
import {
  createInitialTaskResponse,
  TaskDefinition,
  TaskSubmission,
  TaskPrompt,
  PromptGrade,
  parseTaskTableResponse,
} from '../../core/models/task.model';
import { GraphData, GraphPoint, isGraphData } from '../../core/models/submission.model';
import { GraphCanvasComponent } from '../../shared/components/graph-canvas';
import { CanDeactivateTask } from '../../core/guards/task-deactivate.guard';

@Component({
  selector: 'app-task-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MarkdownComponent,
    GraphCanvasComponent,
  ],
  template: `
    <div class="content-container">
      <a mat-button routerLink="/tasks" class="back-link">
        <mat-icon>arrow_back</mat-icon> Back to Tasks
      </a>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48" />
        </div>
      } @else if (!task()) {
        <mat-card>
          <mat-card-content class="empty-state">
            <mat-icon>error_outline</mat-icon>
            <h2>Task Not Found</h2>
            <p>This task does not exist.</p>
            <a mat-raised-button routerLink="/tasks">Back to Tasks</a>
          </mat-card-content>
        </mat-card>
      } @else {
        <h1 class="page-title">{{ task()!.title }}</h1>
        @if (dueDate()) {
          <p class="due-label">Due {{ formatDate(dueDate()!) }}</p>
        }

        @if (isReviewed()) {
          <mat-card class="feedback-card">
            <mat-card-content>
              <div class="feedback-header">
                <mat-icon class="feedback-icon">grading</mat-icon>
                <h3>Coach Feedback</h3>
              </div>
              <p class="feedback-text">{{ submission()!.coachFeedback }}</p>
            </mat-card-content>
          </mat-card>
        }

        @if (markdownContent()) {
          <mat-card class="prompt-card">
            <mat-card-content>
              <div class="markdown-body">
                <markdown [data]="markdownContent()" katex></markdown>
              </div>
            </mat-card-content>
          </mat-card>
        }

        <mat-divider />

        <h2>Your Responses</h2>

        @for (prompt of task()!.prompts; track $index; let i = $index) {
          @if (!prompt.inline) {
            @if (prompt.sectionHeader) {
              @if (i > 0) {
                <mat-divider class="iv-divider" />
              }
              <h2>{{ prompt.sectionHeader }}</h2>
              @if (getSectionInstructions(prompt.sectionHeader); as instructions) {
                <mat-card class="section-instructions">
                  <mat-card-content class="markdown-body">
                    <markdown [data]="instructions" katex></markdown>
                  </mat-card-content>
                </mat-card>
              }
            }
            @if (shouldShowDivider(i)) {
              <mat-divider class="iv-divider" />
            }
            <mat-card class="response-card">
              <mat-card-content>
                <h3>{{ prompt.label }}</h3>
                @if (prompt.subLabel && !getNextPrompt(i)?.inline) {
                  <p class="sub-label">{{ prompt.subLabel }}</p>
                }

                @if (isSubmitted() || isReviewed()) {
                  <!-- Read-only view -->
                  @switch (prompt.type) {
                    @case ('table') {
                      <div class="table-wrapper">
                        <table class="data-table">
                          @if (prompt.columns) {
                            <thead>
                              <tr>
                                @for (col of getTableHeaders(i); track $index) {
                                  <th>{{ col || '—' }}</th>
                                }
                              </tr>
                            </thead>
                          }
                          <tbody>
                            @for (row of getTableData(i); track $index) {
                              <tr>
                                @for (cell of row; track $index) {
                                  <td>{{ cell || '—' }}</td>
                                }
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    }
                    @case ('graph') {
                      <app-graph-canvas
                        [graphData]="getGraphData(i)"
                        [isReadonly]="true"
                        [showAxisLabelPlaceholders]="false"
                      />
                    }
                    @default {
                      <p class="submitted-response">
                        {{ responses()[i] || '(No response provided)' }}
                      </p>
                    }
                  }
                  @if (isReviewed() && getPromptGrade(i); as grade) {
                    <div
                      class="prompt-grade"
                      [class.correct]="grade.correct"
                      [class.incorrect]="!grade.correct"
                    >
                      <mat-icon>{{ grade.correct ? 'check_circle' : 'cancel' }}</mat-icon>
                      @if (!grade.correct && grade.comment) {
                        <span>{{ grade.comment }}</span>
                      } @else if (grade.correct) {
                        <span>Correct</span>
                      } @else {
                        <span>Incorrect</span>
                      }
                    </div>
                  }
                  <!-- Inline read-only for next prompt if it's inline -->
                  @if (getNextPrompt(i)?.inline) {
                    <div class="inline-partner">
                      <h3>{{ getNextPrompt(i)!.label }}</h3>
                      @if (getNextPrompt(i)!.subLabel) {
                        <p class="sub-label">{{ getNextPrompt(i)!.subLabel }}</p>
                      }
                      <p class="submitted-response">
                        {{ responses()[i + 1] || '(No response provided)' }}
                      </p>
                      @if (isReviewed() && getPromptGrade(i + 1); as inlineGrade) {
                        <div
                          class="prompt-grade inline-grade"
                          [class.correct]="inlineGrade.correct"
                          [class.incorrect]="!inlineGrade.correct"
                        >
                          <mat-icon>{{ inlineGrade.correct ? 'check_circle' : 'cancel' }}</mat-icon>
                          @if (!inlineGrade.correct && inlineGrade.comment) {
                            <span>{{ inlineGrade.comment }}</span>
                          }
                        </div>
                      }
                    </div>
                  }
                } @else {
                  <!-- Editable view -->
                  @if (getNextPrompt(i)?.inline) {
                    <!-- Side-by-side pair -->
                    <div class="inline-group">
                      <div class="inline-field">
                        @if (prompt.subLabel) {
                          <p class="sub-label">{{ prompt.subLabel }}</p>
                        }
                        @switch (prompt.type) {
                          @case ('number') {
                            <mat-form-field
                              appearance="outline"
                              class="response-field number-field"
                            >
                              <mat-label>{{ prompt.inputLabel || prompt.label }}</mat-label>
                              <input
                                matInput
                                type="number"
                                step="any"
                                [value]="responses()[i]"
                                (input)="onResponseChange(i, $event)"
                              />
                            </mat-form-field>
                          }
                          @default {
                            <mat-form-field appearance="outline" class="response-field">
                              <mat-label>{{ prompt.inputLabel || prompt.label }}</mat-label>
                              <input
                                matInput
                                [value]="responses()[i]"
                                (input)="onResponseChange(i, $event)"
                              />
                            </mat-form-field>
                          }
                        }
                      </div>
                      <div class="inline-field">
                        @if (getNextPrompt(i)!.subLabel) {
                          <p class="sub-label">{{ getNextPrompt(i)!.subLabel }}</p>
                        }
                        @switch (getNextPrompt(i)!.type) {
                          @case ('number') {
                            <mat-form-field
                              appearance="outline"
                              class="response-field number-field"
                            >
                              <mat-label>{{ getNextPrompt(i)!.label }}</mat-label>
                              <input
                                matInput
                                type="number"
                                step="any"
                                [value]="responses()[i + 1]"
                                (input)="onResponseChange(i + 1, $event)"
                              />
                            </mat-form-field>
                          }
                          @default {
                            <mat-form-field appearance="outline" class="response-field">
                              <mat-label>{{ getNextPrompt(i)!.label }}</mat-label>
                              <input
                                matInput
                                [value]="responses()[i + 1]"
                                (input)="onResponseChange(i + 1, $event)"
                              />
                            </mat-form-field>
                          }
                        }
                      </div>
                    </div>
                  } @else {
                    @switch (prompt.type) {
                      @case ('text') {
                        <mat-form-field appearance="outline" class="response-field">
                          <mat-label>{{ prompt.label }}</mat-label>
                          <textarea
                            matInput
                            [value]="responses()[i]"
                            (input)="onResponseChange(i, $event)"
                            [rows]="prompt.textRows ?? 4"
                          ></textarea>
                        </mat-form-field>
                      }
                      @case ('short-answer') {
                        <mat-form-field appearance="outline" class="response-field">
                          <mat-label>{{ prompt.label }}</mat-label>
                          <input
                            matInput
                            [value]="responses()[i]"
                            (input)="onResponseChange(i, $event)"
                          />
                        </mat-form-field>
                      }
                      @case ('number') {
                        <mat-form-field appearance="outline" class="response-field number-field">
                          <mat-label>{{ prompt.label }}</mat-label>
                          <input
                            matInput
                            type="number"
                            step="any"
                            [value]="responses()[i]"
                            (input)="onResponseChange(i, $event)"
                          />
                        </mat-form-field>
                      }
                      @case ('table') {
                        <div class="table-wrapper">
                          <table class="data-table editable">
                            @if (prompt.columns) {
                              <thead>
                                <tr>
                                  @for (col of getTableHeaders(i); track $index; let c = $index) {
                                    <th>
                                      @if (prompt.editableColumnHeaders) {
                                        <input
                                          class="table-input header-input"
                                          [value]="col"
                                          placeholder="Column heading"
                                          (input)="onTableHeaderChange(i, c, $event)"
                                          [attr.aria-label]="'Column heading ' + (c + 1)"
                                        />
                                      } @else {
                                        {{ col }}
                                      }
                                    </th>
                                  }
                                </tr>
                              </thead>
                            }
                            <tbody>
                              @for (row of getTableData(i); track $index; let r = $index) {
                                <tr>
                                  @for (cell of row; track $index; let c = $index) {
                                    <td>
                                      @if (isCellReadOnly(prompt, r, c)) {
                                        <span class="readonly-cell">{{ cell }}</span>
                                      } @else {
                                        <input
                                          class="table-input"
                                          [value]="cell"
                                          placeholder="Enter value"
                                          (input)="onTableCellChange(i, r, c, $event)"
                                          [attr.aria-label]="
                                            (getTableHeaders(i)[c] || 'Column ' + (c + 1)) +
                                            ' Row ' + (r + 1)
                                          "
                                        />
                                      }
                                    </td>
                                  }
                                </tr>
                              }
                            </tbody>
                          </table>
                        </div>
                      }
                      @case ('graph') {
                        <div class="graph-label-fields">
                          <mat-form-field appearance="outline" class="response-field">
                            <mat-label>Graph title</mat-label>
                            <input
                              matInput
                              [value]="getGraphData(i).title"
                              (input)="onGraphFieldChange(i, 'title', $event)"
                            />
                          </mat-form-field>
                          <mat-form-field appearance="outline" class="response-field">
                            <mat-label>X-axis label (IV)</mat-label>
                            <input
                              matInput
                              [value]="getGraphData(i).xAxisLabel"
                              (input)="onGraphFieldChange(i, 'xAxisLabel', $event)"
                            />
                          </mat-form-field>
                          <mat-form-field appearance="outline" class="response-field">
                            <mat-label>Y-axis label (DV)</mat-label>
                            <input
                              matInput
                              [value]="getGraphData(i).yAxisLabel"
                              (input)="onGraphFieldChange(i, 'yAxisLabel', $event)"
                            />
                          </mat-form-field>
                        </div>
                        <p class="sub-label graph-help">
                          Add up to {{ prompt.graphConfig?.maxPoints ?? 4 }} points by clicking the
                          grid or using the keyboard. Select line mode to place the two endpoints of
                          your line of best fit.
                        </p>
                        <div class="graph-controls">
                          <button
                            mat-stroked-button
                            type="button"
                            [class.active-toggle]="getGraphMode(i) === 'points'"
                            [attr.aria-pressed]="getGraphMode(i) === 'points'"
                            (click)="setGraphMode(i, 'points')"
                          >
                            Plot points
                          </button>
                          <button
                            mat-stroked-button
                            type="button"
                            [class.active-toggle]="getGraphMode(i) === 'lobf'"
                            [attr.aria-pressed]="getGraphMode(i) === 'lobf'"
                            (click)="setGraphMode(i, 'lobf')"
                          >
                            Draw line of best fit
                          </button>
                          <button
                            mat-stroked-button
                            type="button"
                            (click)="undoGraphAction(i)"
                            [disabled]="
                              !getGraphData(i).points.length && !getGraphData(i).lobfStart
                            "
                          >
                            Undo
                          </button>
                        </div>
                        <app-graph-canvas
                          [graphData]="getGraphData(i)"
                          [showAxisLabelPlaceholders]="false"
                          [snapToTick]="false"
                          [lobfPending]="
                            getGraphData(i).lobfStart && !getGraphData(i).lobfEnd
                              ? getGraphData(i).lobfStart
                              : null
                          "
                          (canvasClicked)="onGraphCanvasClick(i, $event)"
                        />
                        <div class="graph-controls">
                          <mat-form-field appearance="outline">
                            <mat-label>Exact x coordinate</mat-label>
                            <input matInput type="number" [value]="graphCoordinates()[i]?.x ?? ''"
                              (input)="updateGraphCoordinate(i, 'x', $event)" />
                          </mat-form-field>
                          <mat-form-field appearance="outline">
                            <mat-label>Exact y coordinate</mat-label>
                            <input matInput type="number" [value]="graphCoordinates()[i]?.y ?? ''"
                              (input)="updateGraphCoordinate(i, 'y', $event)" />
                          </mat-form-field>
                          <button mat-stroked-button type="button" (click)="placeExactGraphPoint(i)">
                            {{ getGraphMode(i) === 'lobf' ? 'Place line endpoint' : 'Plot point' }}
                          </button>
                        </div>
                        @if (graphCoordinateErrors()[i]) {
                          <p role="alert">{{ graphCoordinateErrors()[i] }}</p>
                        }
                        <p class="graph-point-summary" aria-live="polite">
                          {{ getGraphData(i).points.length }} of
                          {{ prompt.graphConfig?.maxPoints ?? 4 }} points plotted.
                          @if (getGraphData(i).lobfStart && !getGraphData(i).lobfEnd) {
                            First line endpoint placed; add the second endpoint.
                          } @else if (getGraphData(i).lobfStart && getGraphData(i).lobfEnd) {
                            Line of best fit drawn.
                          }
                        </p>
                      }
                    }
                  }
                }
              </mat-card-content>
            </mat-card>
          }
        }

        @if (!isSubmitted() && !isReviewed()) {
          <div class="actions">
            <span class="save-status" aria-live="polite">
              @if (saving()) {
                <mat-icon>sync</mat-icon> Saving...
              } @else if (lastSaved()) {
                <mat-icon>check</mat-icon> Saved
              }
            </span>
            <button
              mat-flat-button
              color="primary"
              (click)="submitTask()"
              [disabled]="saving() || !canSubmit()"
            >
              <mat-icon>send</mat-icon> Submit Task
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: `
    .back-link {
      margin-bottom: 16px;
    }

    .due-label {
      color: #666;
      margin: -8px 0 16px;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .empty-state {
      text-align: center;
      padding: 48px 16px;
      color: #666;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #bbb;
    }

    .feedback-card {
      margin-bottom: 16px;
      border-left: 4px solid #6a1b9a;
    }

    .feedback-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .feedback-icon {
      color: #6a1b9a;
    }

    .feedback-header h3 {
      margin: 0;
      color: #6a1b9a;
    }

    .feedback-text {
      margin: 0;
      white-space: pre-wrap;
    }

    .prompt-card {
      margin-bottom: 24px;
    }

    .section-instructions {
      margin: 0 0 16px;
      background: #f8f9fa;
    }

    .section-instructions .markdown-body > :first-child {
      margin-top: 0;
    }

    .section-instructions .markdown-body > :last-child {
      margin-bottom: 0;
    }

    .markdown-body {
      line-height: 1.6;
    }

    h2 {
      margin: 24px 0 16px;
      font-weight: 400;
    }

    .response-card {
      margin-bottom: 16px;
    }

    .response-card h3 {
      margin: 0 0 12px;
      font-weight: 500;
    }

    .response-field {
      width: 100%;
    }

    .submitted-response {
      margin: 0;
      padding: 12px 16px;
      background: #f5f5f5;
      border-radius: 8px;
      white-space: pre-wrap;
    }

    .actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      align-items: center;
      margin-top: 16px;
      margin-bottom: 32px;
    }

    .save-status {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: #666;
      margin-right: auto;
    }

    .save-status mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    mat-divider {
      margin: 24px 0;
    }

    .number-field {
      max-width: 240px;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .graph-label-fields {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0 12px;
    }

    .graph-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 12px 0;
    }

    .graph-help,
    .graph-point-summary {
      margin: 0 0 12px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }

    .data-table th,
    .data-table td {
      border: 1px solid #e0e0e0;
      padding: 8px 12px;
      text-align: left;
      font-size: 14px;
    }

    .data-table th {
      background: #f5f5f5;
      font-weight: 500;
    }

    .data-table.editable th {
      padding: 0;
    }

    .data-table.editable .header-input {
      min-width: 100px;
      font-weight: 500;
    }

    .data-table.editable td:not(:has(.readonly-cell)) {
      background: #f8fbff;
      padding: 0;
    }

    .table-input {
      width: 100%;
      border: none;
      background: transparent;
      font-size: 14px;
      padding: 8px 12px;
      outline: none;
      box-sizing: border-box;
    }

    .table-input::placeholder {
      color: #aaa;
      font-style: italic;
    }

    .table-input:focus {
      background: color-mix(in srgb, var(--primary-color) 10%, transparent);
      outline: 2px solid var(--primary-color);
      outline-offset: -2px;
    }

    .data-table.editable td:has(.readonly-cell) {
      padding: 8px 12px;
    }

    .iv-divider {
      margin: 32px 0 24px;
    }

    .readonly-cell {
      color: #666;
    }

    .sub-label {
      font-size: 13px;
      color: #666;
      margin: -8px 0 12px;
    }

    .inline-group {
      display: flex;
      gap: 16px;
      align-items: flex-end;
    }

    .inline-field {
      flex: 1;
      min-width: 0;
    }

    .inline-field .sub-label {
      font-size: 13px;
      color: #666;
      margin: 0 0 4px;
    }

    .inline-field .response-field,
    .inline-field .number-field {
      width: 100%;
      max-width: none;
    }

    .inline-partner {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
    }

    .check-result {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      font-size: 14px;
      font-weight: 500;
    }

    .check-result.correct {
      color: #2e7d32;
    }

    .check-result.incorrect {
      color: #c62828;
    }

    .prompt-grade {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      font-size: 14px;
      font-weight: 500;
    }

    .prompt-grade.correct {
      color: #2e7d32;
    }

    .prompt-grade.incorrect {
      color: #c62828;
    }

    .inline-grade {
      margin-top: 0;
      margin-left: 4px;
      white-space: nowrap;
    }
  `,
})
export class TaskDetailComponent implements OnInit, OnDestroy, CanDeactivateTask {
  readonly taskId = input.required<string>();

  private readonly taskService = inject(TaskService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly lastSaved = signal(false);
  protected readonly task = signal<TaskDefinition | null>(null);
  protected readonly dueDate = computed(() => {
    const t = this.task();
    return t ? this.taskService.getDueDate(t.id) : undefined;
  });
  protected readonly submission = signal<TaskSubmission | null>(null);
  protected readonly markdownContent = signal('');
  protected readonly responses = signal<string[]>([]);
  protected readonly graphModes = signal<Record<number, 'points' | 'lobf'>>({});
  protected readonly graphCoordinates = signal<Record<number, { x: string; y: string }>>({});
  protected readonly graphCoordinateErrors = signal<Record<number, string>>({});

  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private autoSaveInterval: ReturnType<typeof setInterval> | null = null;
  private isDirty = false;
  private isSubmittedLocally = false;

  /** Returns true if navigation is safe (submitted, reviewed, or no unsaved changes) */
  canDeactivate(): boolean {
    return this.isSubmittedLocally || this.isSubmitted() || this.isReviewed() || !this.isDirty;
  }

  protected isSubmitted(): boolean {
    return this.submission()?.status === 'submitted';
  }

  protected isReviewed(): boolean {
    return this.submission()?.status === 'reviewed';
  }

  protected canSubmit(): boolean {
    return this.responses().some((r) => r.trim().length > 0);
  }

  protected getNextPrompt(index: number): TaskPrompt | undefined {
    return this.task()?.prompts[index + 1];
  }

  protected getSectionInstructions(header: string): string | undefined {
    return this.task()?.sectionInstructions?.[header];
  }

  protected getGraphData(promptIndex: number): GraphData {
    try {
      const parsed: unknown = JSON.parse(this.responses()[promptIndex] ?? '');
      if (isGraphData(parsed)) return parsed;
    } catch {
      // Use the configured blank graph until a saved response is available.
    }
    const prompt = this.task()?.prompts[promptIndex];
    const initial = prompt ? createInitialTaskResponse(prompt) : '';
    try {
      const parsed: unknown = JSON.parse(initial);
      if (isGraphData(parsed)) return parsed;
    } catch {
      // A graph prompt without valid bounds falls through to the safe defaults.
    }
    return {
      title: '',
      xAxisLabel: '',
      yAxisLabel: '',
      xMin: 0,
      xMax: 10,
      yMin: 0,
      yMax: 10,
      points: [],
      lobfStart: null,
      lobfEnd: null,
      chartType: 'scatter',
    };
  }

  protected getGraphMode(promptIndex: number): 'points' | 'lobf' {
    return this.graphModes()[promptIndex] ?? 'points';
  }

  protected setGraphMode(promptIndex: number, mode: 'points' | 'lobf'): void {
    this.graphModes.update((modes) => ({ ...modes, [promptIndex]: mode }));
  }

  protected onGraphFieldChange(
    promptIndex: number,
    field: 'title' | 'xAxisLabel' | 'yAxisLabel',
    event: Event,
  ): void {
    const value = (event.target as HTMLInputElement).value;
    this.saveGraphData(promptIndex, (graph) => ({ ...graph, [field]: value }));
  }

  protected updateGraphCoordinate(index: number, axis: 'x' | 'y', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.graphCoordinates.update((coordinates) => ({
      ...coordinates,
      [index]: { ...(coordinates[index] || { x: '', y: '' }), [axis]: value },
    }));
    this.graphCoordinateErrors.update((errors) => ({ ...errors, [index]: '' }));
  }

  protected placeExactGraphPoint(index: number): void {
    const coordinates = this.graphCoordinates()[index];
    const graph = this.getGraphData(index);
    const x = Number(coordinates?.x);
    const y = Number(coordinates?.y);
    if (!coordinates?.x.trim() || !coordinates?.y.trim() || !Number.isFinite(x) || !Number.isFinite(y) ||
        graph.xMin >= graph.xMax || graph.yMin >= graph.yMax ||
        x < graph.xMin || x > graph.xMax || y < graph.yMin || y > graph.yMax) {
      this.graphCoordinateErrors.update((errors) => ({
        ...errors, [index]: 'Enter numeric x and y coordinates within the graph bounds.',
      }));
      return;
    }
    this.graphCoordinateErrors.update((errors) => ({ ...errors, [index]: '' }));
    this.onGraphCanvasClick(index, { x, y });
  }

  protected onGraphCanvasClick(promptIndex: number, point: GraphPoint): void {
    const graph = this.getGraphData(promptIndex);
    if (this.getGraphMode(promptIndex) === 'lobf') {
      this.saveGraphData(promptIndex, (current) =>
        !current.lobfStart || current.lobfEnd
          ? { ...current, lobfStart: point, lobfEnd: null }
          : { ...current, lobfEnd: point },
      );
      return;
    }

    const maxPoints = this.task()?.prompts[promptIndex].graphConfig?.maxPoints ?? 4;
    if (graph.points.length >= maxPoints) {
      this.snackBar.open(`This graph allows ${maxPoints} data points.`, 'Dismiss', {
        duration: 3000,
      });
      return;
    }
    this.saveGraphData(promptIndex, (current) => ({
      ...current,
      points: [...current.points, point],
    }));
  }

  protected undoGraphAction(promptIndex: number): void {
    this.saveGraphData(promptIndex, (graph) => {
      if (graph.lobfEnd) return { ...graph, lobfEnd: null };
      if (graph.lobfStart) return { ...graph, lobfStart: null };
      return { ...graph, points: graph.points.slice(0, -1) };
    });
  }

  /** Show a divider when the IV Level prefix changes between non-inline prompts */
  protected shouldShowDivider(index: number): boolean {
    if (index === 0) return false;
    const prompts = this.task()?.prompts;
    if (!prompts) return false;
    const getPrefix = (label: string) => label.match(/^IV Level \d+/)?.[0] ?? '';
    const currentPrefix = getPrefix(prompts[index].label);
    if (!currentPrefix) return false;
    // Find the previous non-inline prompt
    for (let j = index - 1; j >= 0; j--) {
      if (!prompts[j].inline) {
        return getPrefix(prompts[j].label) !== currentPrefix;
      }
    }
    return false;
  }

  async ngOnInit(): Promise<void> {
    const taskDef = this.taskService.getTask(this.taskId());
    if (!taskDef) {
      this.loading.set(false);
      return;
    }

    // Assignments carry the coach-set due date, so load them before showing it
    try {
      await this.taskService.loadAssignments();
    } catch (err) {
      console.error('Failed to load task assignments:', err);
    }

    this.task.set(taskDef);

    // Load markdown prompt
    if (taskDef.promptFile) {
      this.http.get(taskDef.promptFile, { responseType: 'text' }).subscribe({
        next: (content) => this.markdownContent.set(content),
        error: () => this.markdownContent.set('*Task prompt could not be loaded.*'),
      });
    }

    // Get or create submission
    const sub = await this.taskService.getOrCreateTaskSubmission(taskDef.id);
    this.submission.set(sub);

    // If prompt structure changed, reinitialize responses to match current prompts
    if (sub.responses.length !== taskDef.prompts.length) {
      const freshResponses = taskDef.prompts.map(createInitialTaskResponse);
      this.responses.set(freshResponses);
      // Persist the corrected responses so the mismatch is fixed permanently
      if (sub.id) {
        this.taskService.saveDraft(sub.id, freshResponses);
      }
    } else {
      this.responses.set([...sub.responses]);
    }
    this.loading.set(false);

    // Start periodic auto-save every 30 seconds as a safety net
    if (sub.status === 'in-progress') {
      this.autoSaveInterval = setInterval(() => {
        if (this.isDirty) {
          this.flushSave();
        }
      }, 30_000);
    }
  }

  ngOnDestroy(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
    // Flush any pending save on destroy
    this.flushSave();
  }

  protected onResponseChange(index: number, event: Event): void {
    const el = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.responses.update((prev) => {
      const copy = [...prev];
      copy[index] = el.value;
      return copy;
    });
    this.markDirtyAndScheduleSave();
  }

  protected getTableData(promptIndex: number): string[][] {
    const prompt = this.task()?.prompts[promptIndex];
    if (!prompt) return [];
    return parseTaskTableResponse(this.responses()[promptIndex] ?? '', prompt).rows;
  }

  protected getTableHeaders(promptIndex: number): string[] {
    const prompt = this.task()?.prompts[promptIndex];
    if (!prompt) return [];
    return parseTaskTableResponse(this.responses()[promptIndex] ?? '', prompt).headers;
  }

  protected isCellReadOnly(prompt: TaskPrompt, row: number, col: number): boolean {
    return prompt.prefilled?.[row]?.[col] != null;
  }

  protected onTableCellChange(promptIndex: number, row: number, col: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const prompt = this.task()?.prompts[promptIndex];
    if (!prompt) return;
    const response = parseTaskTableResponse(this.responses()[promptIndex] ?? '', prompt);
    response.rows[row][col] = value;
    this.saveTableResponse(promptIndex, prompt, response.headers, response.rows);
  }

  protected onTableHeaderChange(promptIndex: number, column: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const prompt = this.task()?.prompts[promptIndex];
    if (!prompt) return;
    const response = parseTaskTableResponse(this.responses()[promptIndex] ?? '', prompt);
    response.headers[column] = value;
    this.saveTableResponse(promptIndex, prompt, response.headers, response.rows);
  }

  private saveTableResponse(
    promptIndex: number,
    prompt: TaskPrompt,
    headers: string[],
    rows: string[][],
  ): void {
    const value = prompt.editableColumnHeaders ? JSON.stringify({ headers, rows }) : JSON.stringify(rows);
    this.responses.update((prev) => {
      const copy = [...prev];
      copy[promptIndex] = value;
      return copy;
    });
    this.markDirtyAndScheduleSave();
  }

  private saveGraphData(promptIndex: number, update: (graph: GraphData) => GraphData): void {
    const graph = update(this.getGraphData(promptIndex));
    this.responses.update((prev) => {
      const copy = [...prev];
      copy[promptIndex] = JSON.stringify(graph);
      return copy;
    });
    this.markDirtyAndScheduleSave();
  }

  protected isNumberCorrect(promptIndex: number): boolean {
    const prompt = this.task()?.prompts[promptIndex];
    if (!prompt || prompt.expectedAnswer == null) return false;
    const student = parseFloat(this.responses()[promptIndex]);
    if (isNaN(student)) return false;
    const tolerance = prompt.tolerance ?? 0.01;
    return Math.abs(student - prompt.expectedAnswer) <= tolerance;
  }

  protected getPromptGrade(index: number): PromptGrade | null {
    return this.submission()?.promptGrades?.[index] ?? null;
  }

  private markDirtyAndScheduleSave(): void {
    this.isDirty = true;
    this.lastSaved.set(false);
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.flushSave(), 3000);
  }

  private async flushSave(): Promise<void> {
    const sub = this.submission();
    if (!sub?.id || !this.isDirty || this.saving()) return;

    this.saving.set(true);
    try {
      await this.taskService.saveDraft(sub.id, this.responses());
      this.isDirty = false;
      this.lastSaved.set(true);
    } catch {
      this.snackBar.open('Auto-save failed. Your work may not be saved.', 'OK', {
        duration: 3000,
      });
    } finally {
      this.saving.set(false);
    }
  }

  protected async submitTask(): Promise<void> {
    const sub = this.submission();
    if (!sub?.id) return;

    this.saving.set(true);
    try {
      await this.taskService.submit(sub.id, this.responses());
      this.isDirty = false;
      this.isSubmittedLocally = true;
      this.snackBar.open('Task submitted!', '', { duration: 3000 });
      this.router.navigate(['/tasks']);
    } finally {
      this.saving.set(false);
    }
  }

  protected formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
