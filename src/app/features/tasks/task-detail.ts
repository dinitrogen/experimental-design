import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
  OnInit,
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
import { TaskDefinition, TaskSubmission, TaskPrompt } from '../../core/models/task.model';

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
        <p class="due-label">Due {{ formatDate(task()!.dueDate) }}</p>

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

        <mat-card class="prompt-card">
          <mat-card-content>
            <div class="markdown-body">
              <markdown [data]="markdownContent()"></markdown>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-divider />

        <h2>Your Responses</h2>

        @for (prompt of task()!.prompts; track $index; let i = $index) {
          <mat-card class="response-card">
            <mat-card-content>
              <h3>{{ prompt.label }}</h3>

              @if (isSubmitted() || isReviewed()) {
                <!-- Read-only view -->
                @switch (prompt.type) {
                  @case ('table') {
                    <div class="table-wrapper">
                      <table class="data-table">
                        @if (prompt.columns) {
                          <thead>
                            <tr>
                              @for (col of prompt.columns; track col) {
                                <th>{{ col }}</th>
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
                  @default {
                    <p class="submitted-response">{{ responses()[i] || '(No response provided)' }}</p>
                  }
                }
                @if (prompt.type === 'number' && prompt.expectedAnswer != null && isReviewed()) {
                  <div class="check-result" [class.correct]="isNumberCorrect(i)" [class.incorrect]="!isNumberCorrect(i)">
                    <mat-icon>{{ isNumberCorrect(i) ? 'check_circle' : 'cancel' }}</mat-icon>
                    {{ isNumberCorrect(i) ? 'Correct' : 'Expected: ' + prompt.expectedAnswer }}
                  </div>
                }
              } @else {
                <!-- Editable view -->
                @switch (prompt.type) {
                  @case ('text') {
                    <mat-form-field appearance="outline" class="response-field">
                      <mat-label>{{ prompt.label }}</mat-label>
                      <textarea
                        matInput
                        [value]="responses()[i]"
                        (input)="onResponseChange(i, $event)"
                        rows="4"
                      ></textarea>
                      @if (prompt.hint) {
                        <mat-hint>{{ prompt.hint }}</mat-hint>
                      }
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
                      @if (prompt.hint) {
                        <mat-hint>{{ prompt.hint }}</mat-hint>
                      }
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
                      @if (prompt.hint) {
                        <mat-hint>{{ prompt.hint }}</mat-hint>
                      }
                    </mat-form-field>
                  }
                  @case ('table') {
                    <div class="table-wrapper">
                      <table class="data-table editable">
                        @if (prompt.columns) {
                          <thead>
                            <tr>
                              @for (col of prompt.columns; track col) {
                                <th>{{ col }}</th>
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
                                      (input)="onTableCellChange(i, r, c, $event)"
                                      [attr.aria-label]="(prompt.columns?.[c] ?? 'Column ' + (c + 1)) + ' Row ' + (r + 1)"
                                    />
                                  }
                                </td>
                              }
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                    @if (prompt.hint) {
                      <p class="table-hint">{{ prompt.hint }}</p>
                    }
                  }
                }
              }
            </mat-card-content>
          </mat-card>
        }

        @if (!isSubmitted() && !isReviewed()) {
          <div class="actions">
            <button
              mat-button
              (click)="saveDraft()"
              [disabled]="saving()"
            >
              <mat-icon>save</mat-icon> Save Draft
            </button>
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
      margin-top: 16px;
      margin-bottom: 32px;
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

    .table-input {
      width: 100%;
      border: none;
      background: transparent;
      font-size: 14px;
      padding: 4px 0;
      outline: none;
    }

    .table-input:focus {
      border-bottom: 2px solid #1565c0;
    }

    .data-table.editable td {
      padding: 4px 8px;
    }

    .readonly-cell {
      color: #666;
    }

    .table-hint {
      font-size: 12px;
      color: #666;
      margin-top: 8px;
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
  `,
})
export class TaskDetailComponent implements OnInit {
  readonly taskId = input.required<string>();

  private readonly taskService = inject(TaskService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly task = signal<TaskDefinition | null>(null);
  protected readonly submission = signal<TaskSubmission | null>(null);
  protected readonly markdownContent = signal('');
  protected readonly responses = signal<string[]>([]);

  protected isSubmitted(): boolean {
    return this.submission()?.status === 'submitted';
  }

  protected isReviewed(): boolean {
    return this.submission()?.status === 'reviewed';
  }

  protected canSubmit(): boolean {
    return this.responses().some((r) => r.trim().length > 0);
  }

  async ngOnInit(): Promise<void> {
    const taskDef = this.taskService.getTask(this.taskId());
    if (!taskDef) {
      this.loading.set(false);
      return;
    }

    this.task.set(taskDef);

    // Load markdown prompt
    this.http.get(taskDef.promptFile, { responseType: 'text' }).subscribe({
      next: (content) => this.markdownContent.set(content),
      error: () => this.markdownContent.set('*Task prompt could not be loaded.*'),
    });

    // Get or create submission
    const sub = await this.taskService.getOrCreateTaskSubmission(taskDef.id);
    this.submission.set(sub);
    this.responses.set([...sub.responses]);
    this.loading.set(false);
  }

  protected onResponseChange(index: number, event: Event): void {
    const el = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.responses.update((prev) => {
      const copy = [...prev];
      copy[index] = el.value;
      return copy;
    });
  }

  protected getTableData(promptIndex: number): string[][] {
    const raw = this.responses()[promptIndex];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* fall through */ }
    const prompt = this.task()?.prompts[promptIndex];
    const rows = prompt?.rows ?? 1;
    const cols = prompt?.columns?.length ?? 1;
    return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));
  }

  protected isCellReadOnly(prompt: TaskPrompt, row: number, col: number): boolean {
    return prompt.prefilled?.[row]?.[col] != null;
  }

  protected onTableCellChange(promptIndex: number, row: number, col: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const table = this.getTableData(promptIndex);
    table[row][col] = value;
    this.responses.update((prev) => {
      const copy = [...prev];
      copy[promptIndex] = JSON.stringify(table);
      return copy;
    });
  }

  protected isNumberCorrect(promptIndex: number): boolean {
    const prompt = this.task()?.prompts[promptIndex];
    if (!prompt || prompt.expectedAnswer == null) return false;
    const student = parseFloat(this.responses()[promptIndex]);
    if (isNaN(student)) return false;
    const tolerance = prompt.tolerance ?? 0.01;
    return Math.abs(student - prompt.expectedAnswer) <= tolerance;
  }

  protected async saveDraft(): Promise<void> {
    const sub = this.submission();
    if (!sub?.id) return;

    this.saving.set(true);
    try {
      await this.taskService.saveDraft(sub.id, this.responses());
      this.snackBar.open('Draft saved!', '', { duration: 2000 });
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
