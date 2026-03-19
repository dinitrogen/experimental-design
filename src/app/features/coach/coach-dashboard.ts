import { ChangeDetectionStrategy, Component, inject, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { StudentService } from '../../core/services/student.service';
import { SubmissionService } from '../../core/services/submission.service';
import { TaskService } from '../../core/services/task.service';
import { ReportSubmission } from '../../core/models/submission.model';
import { TaskSubmission } from '../../core/models/task.model';
import { AppUser } from '../../core/models/user.model';

@Component({
  selector: 'app-coach-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="content-container">
      <h1 class="page-title">Welcome, {{ coachName() }}</h1>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48" />
        </div>
      } @else {
        <!-- Stats Overview -->
        <div class="stats-grid">
          <mat-card>
            <mat-card-content class="stat-card">
              <mat-icon>people</mat-icon>
              <div class="stat-value">{{ students().length }}</div>
              <div class="stat-label">Students</div>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-content class="stat-card accent">
              <mat-icon>rate_review</mat-icon>
              <div class="stat-value">{{ pendingReviews() }}</div>
              <div class="stat-label">Needs Review</div>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-content class="stat-card" [class.accent]="pendingTaskReviews() > 0">
              <mat-icon>task_alt</mat-icon>
              <div class="stat-value">{{ pendingTaskReviews() }}</div>
              <div class="stat-label">Tasks to Review</div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Quick Actions -->
        <h2 class="section-title">Coach Actions</h2>
        <div class="card-grid">
          <mat-card>
            <mat-card-header>
              <mat-icon mat-card-avatar>people</mat-icon>
              <mat-card-title>Student Management</mat-card-title>
              <mat-card-subtitle>Create accounts and manage your roster</mat-card-subtitle>
            </mat-card-header>
            <mat-card-actions>
              <a mat-button routerLink="/coach/students">Manage Students</a>
            </mat-card-actions>
          </mat-card>

          <mat-card>
            <mat-card-header>
              <mat-icon mat-card-avatar>rate_review</mat-icon>
              <mat-card-title>Review Submissions</mat-card-title>
              <mat-card-subtitle>
                @if (pendingReviews() > 0) {
                  {{ pendingReviews() }} report{{ pendingReviews() === 1 ? '' : 's' }} waiting
                } @else {
                  All reports reviewed
                }
              </mat-card-subtitle>
            </mat-card-header>
            <mat-card-actions>
              <a mat-button routerLink="/coach/submissions">View Submissions</a>
            </mat-card-actions>
          </mat-card>

          <mat-card>
            <mat-card-header>
              <mat-icon mat-card-avatar>task_alt</mat-icon>
              <mat-card-title>Review Tasks</mat-card-title>
              <mat-card-subtitle>
                @if (pendingTaskReviews() > 0) {
                  {{ pendingTaskReviews() }} task{{ pendingTaskReviews() === 1 ? '' : 's' }} waiting
                } @else {
                  All tasks reviewed
                }
              </mat-card-subtitle>
            </mat-card-header>
            <mat-card-actions>
              <a mat-button routerLink="/coach/submissions">View Tasks</a>
            </mat-card-actions>
          </mat-card>


        </div>
      }
    </div>
  `,
  styles: `
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .stat-card {
      text-align: center;
      padding: 16px;
    }

    .stat-card mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #1565c0;
    }

    .stat-card.accent mat-icon {
      color: #e65100;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 600;
      margin: 8px 0 4px;
    }

    .stat-label {
      font-size: 13px;
      color: #666;
    }

    .section-title {
      margin: 8px 0 16px;
      font-size: 18px;
    }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
  `,
})
export class CoachDashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly studentService = inject(StudentService);
  private readonly submissionService = inject(SubmissionService);
  private readonly taskService = inject(TaskService);

  protected readonly loading = signal(true);
  protected readonly students = signal<AppUser[]>([]);
  protected readonly submissions = signal<ReportSubmission[]>([]);
  protected readonly taskSubmissions = signal<TaskSubmission[]>([]);

  protected readonly coachName = computed(
    () => this.authService.user()?.displayName || 'Coach'
  );

  protected readonly pendingReviews = computed(
    () => this.submissions().filter((s) => s.status === 'submitted').length
  );

  protected readonly pendingTaskReviews = computed(
    () => this.taskSubmissions().filter((s) => s.status === 'submitted').length
  );

  constructor() {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      this.loading.set(true);
      const [students, subs, taskSubs] = await Promise.all([
        this.studentService.getAllStudents(),
        this.submissionService.getAllSubmitted(),
        this.taskService.getAllSubmittedTasks(),
      ]);
      this.students.set(students);
      this.submissions.set(subs);
      this.taskSubmissions.set(taskSubs);
    } finally {
      this.loading.set(false);
    }
  }
}
