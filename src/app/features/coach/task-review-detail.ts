import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MarkdownComponent } from 'ngx-markdown';
import { TaskService } from '../../core/services/task.service';
import { TaskSubmission, getTaskDefinition, TaskDefinition, TaskPrompt } from '../../core/models/task.model';
import {
  Firestore,
  doc,
  getDoc,
} from '@angular/fire/firestore';

@Component({
  selector: 'app-task-review-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatTooltipModule,
    MarkdownComponent,
  ],
  template: `
    <div class="content-container">
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48" />
        </div>
      } @else if (!submission()) {
        <mat-card>
          <mat-card-content class="empty-state">
            <mat-icon>error_outline</mat-icon>
            <h2>Task Submission Not Found</h2>
            <button mat-raised-button (click)="goBack()">Back to Reviews</button>
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="page-header">
          <button mat-icon-button (click)="goBack()" aria-label="Back to reviews" matTooltip="Back to reviews">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1 class="page-title">{{ taskDef()?.title ?? submission()!.taskId }}</h1>
            <p class="subtitle">Submitted by {{ submission()!.studentDisplayName || submission()!.studentUid }}</p>
          </div>
        </div>

        <!-- Task Prompt -->
        <mat-card class="prompt-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>description</mat-icon>
            <mat-card-title>Task Prompt</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="markdown-body">
              <markdown [data]="markdownContent()"></markdown>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-divider />

        <!-- Student Responses -->
        <h2>Student Responses</h2>
        @for (response of submission()!.responses; track $index; let i = $index) {
          <mat-card class="response-card">
            <mat-card-content>
              <h3>{{ getPromptLabel(i) }}</h3>
              @if (isTablePrompt(i)) {
                <div class="table-wrapper">
                  <table class="data-table">
                    @if (getPrompt(i)?.columns; as cols) {
                      <thead>
                        <tr>
                          @for (col of cols; track col) {
                            <th>{{ col }}</th>
                          }
                        </tr>
                      </thead>
                    }
                    <tbody>
                      @for (row of parseTable(response); track $index) {
                        <tr>
                          @for (cell of row; track $index) {
                            <td>{{ cell || '—' }}</td>
                          }
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <p class="response-text">{{ response || '(No response provided)' }}</p>
              }
            </mat-card-content>
          </mat-card>
        }

        <mat-divider />

        <!-- Feedback -->
        <h2>Coach Feedback</h2>
        <mat-card>
          <mat-card-content>
            <mat-form-field appearance="outline" class="feedback-field">
              <mat-label>Feedback for student</mat-label>
              <textarea
                matInput
                [value]="feedback()"
                (input)="feedback.set(asString($event))"
                rows="5"
                placeholder="Write feedback for the student..."
              ></textarea>
            </mat-form-field>
            <div class="actions">
              <button
                mat-button
                color="warn"
                (click)="deleteSubmission()"
                [disabled]="saving()"
              >
                <mat-icon>delete</mat-icon>
                Delete & Reset
              </button>
              <button
                mat-flat-button
                color="primary"
                (click)="saveReview()"
                [disabled]="saving()"
              >
                <mat-icon>check</mat-icon>
                {{ submission()!.status === 'reviewed' ? 'Update Review' : 'Submit Review' }}
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: `
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

    .page-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .page-title {
      margin: 0;
    }

    .subtitle {
      margin: 0;
      color: #666;
      font-size: 14px;
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
      margin-bottom: 12px;
    }

    .response-card h3 {
      margin: 0 0 8px;
      font-weight: 500;
    }

    .response-text {
      margin: 0;
      padding: 12px 16px;
      background: #f5f5f5;
      border-radius: 8px;
      white-space: pre-wrap;
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

    mat-divider {
      margin: 24px 0;
    }

    .feedback-field {
      width: 100%;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 8px;
    }
  `,
})
export class TaskReviewDetailComponent implements OnInit {
  readonly id = input.required<string>();

  private readonly firestore = inject(Firestore);
  private readonly taskService = inject(TaskService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly submission = signal<TaskSubmission | null>(null);
  protected readonly taskDef = signal<TaskDefinition | null>(null);
  protected readonly markdownContent = signal('');
  protected readonly feedback = signal('');

  async ngOnInit(): Promise<void> {
    try {
      const docRef = doc(this.firestore, `taskSubmissions/${this.id()}`);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;

      const sub = { id: snap.id, ...snap.data() } as TaskSubmission;
      this.submission.set(sub);
      this.feedback.set(sub.coachFeedback ?? '');

      const def = getTaskDefinition(sub.taskId);
      this.taskDef.set(def ?? null);

      if (def) {
        this.http.get(def.promptFile, { responseType: 'text' }).subscribe({
          next: (content) => this.markdownContent.set(content),
          error: () => this.markdownContent.set('*Task prompt could not be loaded.*'),
        });
      }
    } finally {
      this.loading.set(false);
    }
  }

  protected asString(event: Event): string {
    return (event.target as HTMLTextAreaElement).value;
  }

  protected async saveReview(): Promise<void> {
    const sub = this.submission();
    if (!sub?.id) return;

    this.saving.set(true);
    try {
      await this.taskService.saveTaskReview(sub.id, this.feedback());
      this.submission.update((s) => s ? { ...s, status: 'reviewed' } : s);
      this.snackBar.open('Review saved!', '', { duration: 3000 });
    } finally {
      this.saving.set(false);
    }
  }

  protected async deleteSubmission(): Promise<void> {
    const sub = this.submission();
    if (!sub?.id) return;

    this.saving.set(true);
    try {
      await this.taskService.deleteTaskSubmission(sub.id);
      this.snackBar.open('Submission deleted — task reset for student', '', { duration: 3000 });
      this.goBack();
    } finally {
      this.saving.set(false);
    }
  }

  protected goBack(): void {
    this.router.navigate(['/coach/submissions']);
  }

  protected getPrompt(index: number): TaskPrompt | undefined {
    return this.taskDef()?.prompts[index];
  }

  protected getPromptLabel(index: number): string {
    return this.taskDef()?.prompts[index]?.label ?? `Response ${index + 1}`;
  }

  protected isTablePrompt(index: number): boolean {
    return this.taskDef()?.prompts[index]?.type === 'table';
  }

  protected parseTable(raw: string): string[][] {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* fall through */ }
    return [];
  }
}
