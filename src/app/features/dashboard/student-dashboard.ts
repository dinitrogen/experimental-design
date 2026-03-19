import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { ResourceService } from '../../core/services/resource.service';
import { ProgressService } from '../../core/services/progress.service';
import { SubmissionService } from '../../core/services/submission.service';
import { AchievementService } from '../../core/services/achievement.service';
import { TaskService } from '../../core/services/task.service';
import { ReportSubmission } from '../../core/models/submission.model';
import { Achievement, getTemplate, sortAchievements } from '../../core/models/achievement.model';
import { TaskSubmission, getTaskDefinition } from '../../core/models/task.model';

@Component({
  selector: 'app-student-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatChipsModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="content-container">
      <h1 class="page-title">
        Welcome, {{ displayName() }}!
      </h1>

      <div class="stats-row">
        <mat-card class="stat-card">
          <mat-card-content>
            <mat-icon class="stat-icon">menu_book</mat-icon>
            <div class="stat-info">
              <div class="stat-value">{{ completedCount() }} / {{ totalGuides() }}</div>
              <div class="stat-label">Guides Completed</div>
            </div>
          </mat-card-content>
          @if (totalGuides() > 0) {
            <mat-progress-bar
              mode="determinate"
              [value]="progressPercent()"
            ></mat-progress-bar>
          }
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <mat-icon class="stat-icon">assignment</mat-icon>
            <div class="stat-info">
              <div class="stat-value">{{ practiceEventCount() }}</div>
              <div class="stat-label">Practice Events Available</div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- My Submissions -->
      <h2>My Submissions</h2>
      @if (submissions().length === 0 && submittedTasks().length === 0) {
        <mat-card>
          <mat-card-content class="empty-submissions">
            <mat-icon>assignment_turned_in</mat-icon>
            <p>No submissions yet. Complete a practice event or task to see it here!</p>
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="submissions-list">
          @for (sub of submissions(); track sub.id) {
            <mat-card class="submission-card">
              <mat-card-content>
                <div class="submission-info">
                  <div class="submission-title">{{ getEventName(sub) }}</div>
                  <div class="submission-meta">
                    <mat-chip [class]="'status-chip status-' + sub.status">
                      @switch (sub.status) {
                        @case ('draft') { <mat-icon>edit</mat-icon> Draft }
                        @case ('submitted') { <mat-icon>send</mat-icon> Awaiting Review }
                        @case ('reviewed') { <mat-icon>check_circle</mat-icon> Reviewed }
                      }
                    </mat-chip>
                    @if (sub.score != null) {
                      <span class="score-badge">{{ sub.score }}/{{ getMaxTotal(sub) }}</span>
                    }
                  </div>
                </div>
                <div class="submission-actions">
                  @if (sub.status === 'draft') {
                    <a mat-button color="primary"
                       [routerLink]="['/practice-events', sub.practiceEventId, 'report']">
                      <mat-icon>edit</mat-icon>
                      Continue Editing
                    </a>
                  } @else {
                    <a mat-button color="primary"
                       [routerLink]="['/submissions', sub.id]">
                      <mat-icon>visibility</mat-icon>
                      View Report
                    </a>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          }
          @for (task of submittedTasks(); track task.id) {
            <mat-card class="submission-card">
              <mat-card-content>
                <div class="submission-info">
                  <div class="submission-title">{{ getTaskName(task) }}</div>
                  <div class="submission-meta">
                    <mat-chip [class]="'status-chip status-' + task.status">
                      @switch (task.status) {
                        @case ('submitted') { <mat-icon>send</mat-icon> Awaiting Review }
                        @case ('reviewed') { <mat-icon>check_circle</mat-icon> Reviewed }
                      }
                    </mat-chip>
                  </div>
                </div>
                <div class="submission-actions">
                  <a mat-button color="primary" [routerLink]="['/tasks', task.taskId]">
                    <mat-icon>visibility</mat-icon>
                    View Task
                  </a>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }

      <!-- Tasks Due -->
      <h2>Tasks Due</h2>
      @if (pendingTasks().length === 0) {
        <mat-card>
          <mat-card-content class="empty-submissions">
            <mat-icon>task_alt</mat-icon>
            <p>No tasks due right now. Check back soon!</p>
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="submissions-list">
          @for (task of pendingTasks(); track task.id) {
            <mat-card class="submission-card" [class.overdue]="task.isOverdue">
              <mat-card-content>
                <div class="submission-info">
                  <div class="submission-title">{{ task.title }}</div>
                  <div class="submission-meta">
                    <mat-chip [class]="'status-chip status-' + task.status">
                      @switch (task.status) {
                        @case ('not-started') { <mat-icon>radio_button_unchecked</mat-icon> Not Started }
                        @case ('in-progress') { <mat-icon>edit_note</mat-icon> In Progress }
                      }
                    </mat-chip>
                    <span class="due-label" [class.overdue-text]="task.isOverdue">
                      @if (task.isOverdue) {
                        Overdue
                      } @else {
                        Due {{ task.dueFormatted }}
                      }
                    </span>
                  </div>
                </div>
                <div class="submission-actions">
                  <a mat-button color="primary" [routerLink]="['/tasks', task.id]">
                    <mat-icon>{{ task.status === 'not-started' ? 'play_arrow' : 'edit' }}</mat-icon>
                    {{ task.status === 'not-started' ? 'Start' : 'Continue' }}
                  </a>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }

      <!-- Achievements -->
      @if (achievements().length > 0) {
        <h2>Achievements</h2>
        <div class="achievements-list">
          @for (ach of achievements(); track ach.id) {
            <mat-card class="achievement-card" [class.achieved]="ach.completed">
              <mat-card-content>
                <mat-icon class="trophy-icon" [class.earned]="ach.completed">
                  {{ ach.completed ? 'emoji_events' : 'military_tech' }}
                </mat-icon>
                <div class="achievement-info">
                  <div class="achievement-title">{{ getAchievementTitle(ach) }}</div>
                  <div class="achievement-desc">{{ getAchievementDesc(ach) }}</div>
                </div>
                @if (ach.completed) {
                  <mat-icon class="check-icon">check_circle</mat-icon>
                }
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .stat-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
    }

    .stat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #1565c0;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 500;
    }

    .stat-label {
      font-size: 14px;
      color: #666;
    }

    h2 {
      margin: 24px 0 16px;
      font-weight: 400;
    }

    .empty-submissions {
      text-align: center;
      padding: 32px 16px;
      color: #666;
    }

    .empty-submissions mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #bbb;
    }

    .submissions-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .submission-card mat-card-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 16px;
      flex-wrap: wrap;
    }

    .submission-title {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .submission-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .status-chip mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    .status-draft { --mdc-chip-label-text-color: #666; }
    .status-submitted { --mdc-chip-label-text-color: #e65100; }
    .status-reviewed { --mdc-chip-label-text-color: #2e7d32; }

    .score-badge {
      font-weight: 500;
      color: #1565c0;
      font-size: 15px;
    }

    .achievements-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .achievement-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
    }

    .trophy-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #bdbdbd;
    }

    .trophy-icon.earned {
      color: #ffc107;
    }

    .achievement-card.achieved {
      border-left: 4px solid #ffc107;
    }

    .achievement-info {
      flex: 1;
    }

    .achievement-title {
      font-size: 16px;
      font-weight: 500;
    }

    .achievement-desc {
      font-size: 13px;
      color: #666;
      margin-top: 2px;
    }

    .check-icon {
      color: #4caf50;
    }

    .overdue {
      border-left: 4px solid #e65100;
    }

    .due-label {
      font-size: 13px;
      color: #666;
    }

    .overdue-text {
      color: #e65100;
      font-weight: 500;
    }

    .status-not-started mat-icon,
    .status-in-progress mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    .view-all-link {
      margin-top: 8px;
    }
  `,
})
export class StudentDashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly resourceService = inject(ResourceService);
  private readonly progressService = inject(ProgressService);
  private readonly submissionService = inject(SubmissionService);
  private readonly achievementService = inject(AchievementService);
  private readonly taskService = inject(TaskService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly completedCount = signal(0);
  protected readonly submissions = signal<ReportSubmission[]>([]);
  protected readonly achievements = signal<Achievement[]>([]);
  private readonly taskSubmissions = signal<TaskSubmission[]>([]);

  protected readonly displayName = computed(
    () => this.authService.user()?.displayName || 'Student'
  );

  protected readonly totalGuides = computed(
    () => this.resourceService.getTotalCount(false)
  );

  protected readonly progressPercent = computed(() => {
    const total = this.totalGuides();
    return total > 0 ? Math.round((this.completedCount() / total) * 100) : 0;
  });

  protected readonly practiceEventCount = computed(
    () => this.resourceService.getGuidesByCategory('practice-events')
      .filter((g) => !g.coachOnly && !this.resourceService.hiddenGuideIds().has(g.id)).length
  );

  protected readonly submittedTasks = computed(() =>
    this.taskSubmissions().filter((t) => t.status === 'submitted' || t.status === 'reviewed')
  );

  protected readonly pendingTasks = computed(() => {
    const assignedDefs = this.taskService.getAssignedTasks();
    const subs = this.taskSubmissions();
    const today = new Date().toISOString().slice(0, 10);

    return assignedDefs
      .filter((def) => {
        const sub = subs.find((s) => s.taskId === def.id);
        return !sub || sub.status === 'not-started' || sub.status === 'in-progress';
      })
      .map((def) => {
        const sub = subs.find((s) => s.taskId === def.id);
        const dueDate = new Date(def.dueDate + 'T00:00:00');
        return {
          id: def.id,
          title: def.title,
          status: sub?.status ?? 'not-started' as const,
          isOverdue: def.dueDate < today,
          dueFormatted: dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        };
      });
  });

  async ngOnInit(): Promise<void> {
    // Record today's login for streak tracking
    this.achievementService.recordLogin();

    const [count, submissions, rawAchievements, taskSubs] = await Promise.all([
      this.progressService.getCompletedCount(),
      this.submissionService.getMySubmissions(),
      this.achievementService.getMyAchievements(),
      this.taskService.getMyTaskSubmissions(),
      this.taskService.loadAssignments(),
    ] as const);
    this.completedCount.set(count);
    this.submissions.set(submissions);
    this.taskSubmissions.set(taskSubs);

    // Check auto-completions and update
    const refreshed = await this.achievementService.refreshAutoCompletions(rawAchievements);
    this.achievements.set(sortAchievements(refreshed));

    // Show toast for newly completed achievements
    const newlyCompleted = refreshed.filter(
      (r) => r.completed && !rawAchievements.find((a) => a.id === r.id)?.completed
    );
    for (const ach of newlyCompleted) {
      const title = getTemplate(ach.templateId)?.title ?? ach.templateId;
      this.snackBar.open(`🏆 Achievement unlocked: ${title}!`, 'Nice!', { duration: 5000 });
    }
  }

  protected getEventName(sub: ReportSubmission): string {
    return this.resourceService.getGuideBySlug(sub.practiceEventId)?.title ?? sub.practiceEventId;
  }

  private static readonly REGIONAL_TOTAL = 106;
  private static readonly STATE_TOTAL = 118;

  protected getMaxTotal(sub: ReportSubmission): number {
    return sub.isStateNational
      ? StudentDashboardComponent.STATE_TOTAL
      : StudentDashboardComponent.REGIONAL_TOTAL;
  }

  protected getTaskName(task: TaskSubmission): string {
    return getTaskDefinition(task.taskId)?.title ?? task.taskId;
  }

  protected getAchievementTitle(ach: Achievement): string {
    return getTemplate(ach.templateId)?.title ?? ach.templateId;
  }

  protected getAchievementDesc(ach: Achievement): string {
    return getTemplate(ach.templateId)?.description ?? '';
  }
}
