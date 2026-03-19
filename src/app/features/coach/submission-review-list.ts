import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { SubmissionService } from '../../core/services/submission.service';
import { TaskService } from '../../core/services/task.service';
import { ResourceService } from '../../core/services/resource.service';
import { ReportSubmission } from '../../core/models/submission.model';
import { TaskSubmission, getTaskDefinition } from '../../core/models/task.model';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-submission-review-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
    MatTabsModule,
  ],
  template: `
    <div class="content-container">
      <h1 class="page-title">Submission Reviews</h1>

      <mat-tab-group (selectedIndexChange)="activeTab.set($event)">
        <!-- Reports Tab -->
        <mat-tab label="Reports">
          <div class="tab-content">
            <div class="tab-header">
              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Filter by status</mat-label>
                <mat-select [value]="statusFilter()" (selectionChange)="statusFilter.set($event.value)">
                  <mat-option value="all">All</mat-option>
                  <mat-option value="submitted">Needs Review</mat-option>
                  <mat-option value="reviewed">Reviewed</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            @if (loading()) {
              <div class="loading-container">
                <mat-spinner diameter="48" />
              </div>
            } @else if (filteredSubmissions().length === 0) {
              <mat-card>
                <mat-card-content class="empty-state">
                  <mat-icon>inbox</mat-icon>
                  <h2>No Submissions</h2>
                  <p>
                    @if (statusFilter() === 'submitted') {
                      No reports are waiting for review.
                    } @else if (statusFilter() === 'reviewed') {
                      No reports have been reviewed yet.
                    } @else {
                      No student reports have been submitted yet.
                    }
                  </p>
                </mat-card-content>
              </mat-card>
            } @else {
              <mat-card>
                <table mat-table [dataSource]="filteredSubmissions()" class="review-table">
                  <ng-container matColumnDef="event">
                    <th mat-header-cell *matHeaderCellDef>Practice Event</th>
                    <td mat-cell *matCellDef="let sub">{{ getEventName(sub.practiceEventId) }}</td>
                  </ng-container>

                  <ng-container matColumnDef="student">
                    <th mat-header-cell *matHeaderCellDef>Student</th>
                    <td mat-cell *matCellDef="let sub">{{ sub.studentDisplayName || sub.studentUid }}</td>
                  </ng-container>

                  <ng-container matColumnDef="submittedAt">
                    <th mat-header-cell *matHeaderCellDef>Submitted</th>
                    <td mat-cell *matCellDef="let sub">{{ formatDate(sub.submittedAt) }}</td>
                  </ng-container>

                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let sub">
                      <mat-chip-set>
                        <mat-chip
                          [highlighted]="sub.status === 'submitted'"
                          [class.chip-submitted]="sub.status === 'submitted'"
                          [class.chip-reviewed]="sub.status === 'reviewed'"
                        >
                          {{ sub.status === 'submitted' ? 'Needs Review' : 'Reviewed' }}
                        </mat-chip>
                      </mat-chip-set>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="score">
                    <th mat-header-cell *matHeaderCellDef>Score</th>
                    <td mat-cell *matCellDef="let sub">
                      {{ sub.score != null ? sub.score : '—' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let sub">
                      <a
                        mat-icon-button
                        [routerLink]="['/coach/submissions', sub.id]"
                        [attr.aria-label]="'Review submission from ' + (sub.studentDisplayName || sub.studentUid)"
                        matTooltip="Review submission"
                      >
                        <mat-icon>rate_review</mat-icon>
                      </a>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
                </table>
              </mat-card>
            }
          </div>
        </mat-tab>

        <!-- Tasks Tab -->
        <mat-tab label="Tasks">
          <div class="tab-content">
            <div class="tab-header">
              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Filter by status</mat-label>
                <mat-select [value]="taskStatusFilter()" (selectionChange)="taskStatusFilter.set($event.value)">
                  <mat-option value="all">All</mat-option>
                  <mat-option value="submitted">Needs Review</mat-option>
                  <mat-option value="reviewed">Reviewed</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            @if (loadingTasks()) {
              <div class="loading-container">
                <mat-spinner diameter="48" />
              </div>
            } @else if (filteredTaskSubmissions().length === 0) {
              <mat-card>
                <mat-card-content class="empty-state">
                  <mat-icon>inbox</mat-icon>
                  <h2>No Task Submissions</h2>
                  <p>No student task submissions yet.</p>
                </mat-card-content>
              </mat-card>
            } @else {
              <mat-card>
                <table mat-table [dataSource]="filteredTaskSubmissions()" class="review-table">
                  <ng-container matColumnDef="taskName">
                    <th mat-header-cell *matHeaderCellDef>Task</th>
                    <td mat-cell *matCellDef="let sub">{{ getTaskName(sub.taskId) }}</td>
                  </ng-container>

                  <ng-container matColumnDef="taskStudent">
                    <th mat-header-cell *matHeaderCellDef>Student</th>
                    <td mat-cell *matCellDef="let sub">{{ sub.studentDisplayName || sub.studentUid }}</td>
                  </ng-container>

                  <ng-container matColumnDef="taskSubmittedAt">
                    <th mat-header-cell *matHeaderCellDef>Submitted</th>
                    <td mat-cell *matCellDef="let sub">{{ formatDate(sub.submittedAt) }}</td>
                  </ng-container>

                  <ng-container matColumnDef="taskStatus">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let sub">
                      <mat-chip-set>
                        <mat-chip
                          [highlighted]="sub.status === 'submitted'"
                          [class.chip-submitted]="sub.status === 'submitted'"
                          [class.chip-reviewed]="sub.status === 'reviewed'"
                        >
                          {{ sub.status === 'submitted' ? 'Needs Review' : 'Reviewed' }}
                        </mat-chip>
                      </mat-chip-set>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="taskActions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let sub">
                      <a
                        mat-icon-button
                        [routerLink]="['/coach/tasks', sub.id]"
                        [attr.aria-label]="'Review task from ' + (sub.studentDisplayName || sub.studentUid)"
                        matTooltip="Review task submission"
                      >
                        <mat-icon>rate_review</mat-icon>
                      </a>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="taskColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: taskColumns"></tr>
                </table>
              </mat-card>
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: `
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .page-header .page-title {
      margin: 0;
    }

    .tab-content {
      padding-top: 16px;
    }

    .tab-header {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 16px;
    }

    .filter-field {
      width: 200px;
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

    .empty-state h2 {
      margin: 16px 0 8px;
    }

    .review-table {
      width: 100%;
    }

    .chip-submitted {
      --mat-chip-label-text-color: #e65100;
      --mat-chip-elevated-container-color: #fff3e0;
    }

    .chip-reviewed {
      --mat-chip-label-text-color: #2e7d32;
      --mat-chip-elevated-container-color: #e8f5e9;
    }
  `,
})
export class SubmissionReviewListComponent {
  private readonly submissionService = inject(SubmissionService);
  private readonly taskService = inject(TaskService);
  private readonly resourceService = inject(ResourceService);

  protected readonly submissions = signal<ReportSubmission[]>([]);
  protected readonly taskSubmissions = signal<TaskSubmission[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadingTasks = signal(true);
  protected readonly activeTab = signal(0);
  protected readonly statusFilter = signal<'all' | 'submitted' | 'reviewed'>('all');
  protected readonly taskStatusFilter = signal<'all' | 'submitted' | 'reviewed'>('all');
  protected readonly displayedColumns = ['event', 'student', 'submittedAt', 'status', 'score', 'actions'];
  protected readonly taskColumns = ['taskName', 'taskStudent', 'taskSubmittedAt', 'taskStatus', 'taskActions'];

  protected readonly filteredSubmissions = computed(() => {
    const filter = this.statusFilter();
    const all = this.submissions();
    if (filter === 'all') return all;
    return all.filter((s) => s.status === filter);
  });

  protected readonly filteredTaskSubmissions = computed(() => {
    const filter = this.taskStatusFilter();
    const all = this.taskSubmissions();
    if (filter === 'all') return all;
    return all.filter((s) => s.status === filter);
  });

  constructor() {
    this.loadSubmissions();
    this.loadTaskSubmissions();
  }

  private async loadSubmissions(): Promise<void> {
    try {
      this.loading.set(true);
      const subs = await this.submissionService.getAllSubmitted();
      this.submissions.set(subs);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadTaskSubmissions(): Promise<void> {
    try {
      this.loadingTasks.set(true);
      const subs = await this.taskService.getAllSubmittedTasks();
      this.taskSubmissions.set(subs);
    } finally {
      this.loadingTasks.set(false);
    }
  }

  protected getEventName(practiceEventId: string): string {
    const resource = this.resourceService.getGuideBySlug(practiceEventId);
    return resource?.title ?? practiceEventId;
  }

  protected getTaskName(taskId: string): string {
    return getTaskDefinition(taskId)?.title ?? taskId;
  }

  protected formatDate(ts: Timestamp | null): string {
    if (!ts) return '—';
    const date = ts.toDate();
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}
