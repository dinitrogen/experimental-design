import { ChangeDetectionStrategy, Component, inject, signal, input, computed, effect } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { Timestamp } from '@angular/fire/firestore';
import { StudentService } from '../../core/services/student.service';
import { ResourceService } from '../../core/services/resource.service';
import { AchievementService } from '../../core/services/achievement.service';
import { AppUser } from '../../core/models/user.model';
import { ReadingProgress } from '../../core/models/resource.model';
import { ReportSubmission } from '../../core/models/submission.model';
import { Achievement, ACHIEVEMENT_TEMPLATES, getTemplate, sortAchievements } from '../../core/models/achievement.model';

@Component({
  selector: 'app-student-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatMenuModule,
    TitleCasePipe,
  ],
  template: `
    <div class="content-container">
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48" />
        </div>
      } @else {
        <div class="page-header">
          <button mat-icon-button (click)="goBack()" aria-label="Back to students" matTooltip="Back to students">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1 class="page-title">{{ studentName() }}</h1>
        </div>

        <!-- Summary Cards -->
        <div class="stats-grid">
          <mat-card>
            <mat-card-content class="stat-card">
              <mat-icon>menu_book</mat-icon>
              <div class="stat-value">{{ completedGuides() }}</div>
              <div class="stat-label">Guides Completed</div>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-content class="stat-card">
              <mat-icon>assignment</mat-icon>
              <div class="stat-value">{{ submissions().length }}</div>
              <div class="stat-label">Reports</div>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-content class="stat-card">
              <mat-icon>grading</mat-icon>
              <div class="stat-value">{{ averageScore() }}</div>
              <div class="stat-label">Avg Score</div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Submissions -->
        <h2 class="section-title">Report Submissions</h2>
        @if (submissions().length === 0) {
          <mat-card>
            <mat-card-content class="empty-state">
              <p>No submissions yet.</p>
            </mat-card-content>
          </mat-card>
        } @else {
          <mat-card>
            <table mat-table [dataSource]="submissions()" class="full-table">
              <ng-container matColumnDef="event">
                <th mat-header-cell *matHeaderCellDef>Event</th>
                <td mat-cell *matCellDef="let sub">{{ getEventName(sub.practiceEventId) }}</td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let sub">
                  <mat-chip-set>
                    <mat-chip
                      [class.chip-draft]="sub.status === 'draft'"
                      [class.chip-submitted]="sub.status === 'submitted'"
                      [class.chip-reviewed]="sub.status === 'reviewed'"
                    >
                      {{ sub.status === 'submitted' ? 'Needs Review' : (sub.status | titlecase) }}
                    </mat-chip>
                  </mat-chip-set>
                </td>
              </ng-container>

              <ng-container matColumnDef="score">
                <th mat-header-cell *matHeaderCellDef>Score</th>
                <td mat-cell *matCellDef="let sub">{{ sub.score != null ? sub.score : '—' }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let sub">
                  @if (sub.status !== 'draft') {
                    <a
                      mat-icon-button
                      [routerLink]="['/coach/submissions', sub.id]"
                      aria-label="View submission"
                      matTooltip="Review submission"
                    >
                      <mat-icon>rate_review</mat-icon>
                    </a>
                  }
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="subColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: subColumns"></tr>
            </table>
          </mat-card>
        }

        <!-- Achievements -->
        <h2 class="section-title">Achievements</h2>
        <div class="achievements-section">
          @if (achievements().length === 0) {
            <mat-card>
              <mat-card-content class="empty-state">
                <p>No achievements assigned yet.</p>
              </mat-card-content>
            </mat-card>
          } @else {
            <div class="achievements-list">
              @for (ach of achievements(); track ach.id) {
                <mat-card class="achievement-card" [class.achieved]="ach.completed">
                  <mat-card-content>
                    <mat-icon class="trophy-icon" [class.earned]="ach.completed">emoji_events</mat-icon>
                    <div class="achievement-info">
                      <div class="achievement-title">{{ getAchievementTitle(ach) }}</div>
                      <div class="achievement-desc">{{ getAchievementDesc(ach) }}</div>
                      @if (ach.completed && ach.completedAt) {
                        <div class="achievement-date">Completed {{ formatDate(ach.completedAt) }}</div>
                      }
                    </div>
                    <button mat-icon-button (click)="removeAchievement(ach)" matTooltip="Remove achievement" aria-label="Remove achievement">
                      <mat-icon>close</mat-icon>
                    </button>
                  </mat-card-content>
                </mat-card>
              }
            </div>
          }

          @if (unassignedTemplates().length > 0) {
            <button mat-stroked-button [matMenuTriggerFor]="achievementMenu" class="assign-btn">
              <mat-icon>add</mat-icon>
              Assign Achievement
            </button>
            <mat-menu #achievementMenu="matMenu">
              @for (tmpl of unassignedTemplates(); track tmpl.id) {
                <button mat-menu-item (click)="assignAchievement(tmpl.id)">
                  <mat-icon>{{ tmpl.icon }}</mat-icon>
                  <span>{{ tmpl.title }}</span>
                </button>
              }
            </mat-menu>
          }
        </div>

        <!-- Reading Progress -->
        <h2 class="section-title">Study Guide Progress</h2>
        @if (guideProgress().length === 0) {
          <mat-card>
            <mat-card-content class="empty-state">
              <p>No reading progress recorded.</p>
            </mat-card-content>
          </mat-card>
        } @else {
          <mat-card>
            <table mat-table [dataSource]="guideProgress()" class="full-table">
              <ng-container matColumnDef="guide">
                <th mat-header-cell *matHeaderCellDef>Study Guide</th>
                <td mat-cell *matCellDef="let p">{{ getGuideName(p.resourceId) }}</td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let p">
                  <mat-chip-set>
                    <mat-chip [class.chip-reviewed]="p.status === 'completed'">
                      {{ p.status | titlecase }}
                    </mat-chip>
                  </mat-chip-set>
                </td>
              </ng-container>

              <ng-container matColumnDef="completedAt">
                <th mat-header-cell *matHeaderCellDef>Completed</th>
                <td mat-cell *matCellDef="let p">{{ formatDate(p.completedAt) }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let p">
                  <button
                    mat-icon-button
                    (click)="resetGuideProgress(p.resourceId)"
                    matTooltip="Reset progress"
                    aria-label="Reset guide progress"
                  >
                    <mat-icon>restart_alt</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="progressColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: progressColumns"></tr>
            </table>
          </mat-card>
        }
      }
    </div>
  `,
  styles: `
    .page-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
    }

    .page-header .page-title {
      margin: 0;
    }

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

    .stat-value {
      font-size: 28px;
      font-weight: 600;
      margin: 8px 0 4px;
    }

    .stat-label {
      font-size: 13px;
      color: #666;
    }

    .section-title {
      margin: 24px 0 12px;
      font-size: 18px;
    }

    .full-table {
      width: 100%;
    }

    .empty-state {
      text-align: center;
      padding: 24px;
      color: #666;
    }

    .chip-draft {
      --mat-chip-label-text-color: #666;
      --mat-chip-elevated-container-color: #f5f5f5;
    }

    .chip-submitted {
      --mat-chip-label-text-color: #e65100;
      --mat-chip-elevated-container-color: #fff3e0;
    }

    .chip-reviewed {
      --mat-chip-label-text-color: #2e7d32;
      --mat-chip-elevated-container-color: #e8f5e9;
    }

    .achievements-section {
      margin-bottom: 16px;
    }

    .achievements-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;
    }

    .achievement-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
    }

    .trophy-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
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
      font-size: 15px;
      font-weight: 500;
    }

    .achievement-desc {
      font-size: 13px;
      color: #666;
    }

    .achievement-date {
      font-size: 12px;
      color: #999;
      margin-top: 2px;
    }

    .assign-btn {
      margin-top: 4px;
    }
  `,
})
export class StudentDetailComponent {
  readonly id = input.required<string>();

  private readonly studentService = inject(StudentService);
  private readonly resourceService = inject(ResourceService);
  private readonly achievementService = inject(AchievementService);
  private readonly router = inject(Router);

  protected readonly loading = signal(true);
  protected readonly student = signal<AppUser | null>(null);
  protected readonly submissions = signal<ReportSubmission[]>([]);
  protected readonly guideProgress = signal<ReadingProgress[]>([]);
  protected readonly achievements = signal<Achievement[]>([]);

  protected readonly subColumns = ['event', 'status', 'score', 'actions'];
  protected readonly progressColumns = ['guide', 'status', 'completedAt', 'actions'];

  protected readonly studentName = computed(() => this.student()?.displayName || 'Student');

  protected readonly completedGuides = computed(
    () => this.guideProgress().filter((p) => p.status === 'completed').length
  );

  protected readonly averageScore = computed(() => {
    const scored = this.submissions().filter((s) => s.score != null);
    if (scored.length === 0) return '—';
    const avg = scored.reduce((sum, s) => sum + (s.score ?? 0), 0) / scored.length;
    return Math.round(avg).toString();
  });

  protected readonly unassignedTemplates = computed(() => {
    const assigned = new Set(this.achievements().map((a) => a.templateId));
    return ACHIEVEMENT_TEMPLATES.filter((t) => !assigned.has(t.id));
  });

  constructor() {
    effect(() => {
      const uid = this.id();
      this.loadData(uid);
    });
  }

  private async loadData(uid: string): Promise<void> {
    try {
      this.loading.set(true);
      const [students, subs, progress, achs] = await Promise.all([
        this.studentService.getAllStudents(),
        this.studentService.getStudentSubmissions(uid),
        this.studentService.getStudentProgress(uid),
        this.achievementService.getAchievementsForStudent(uid),
      ]);
      this.student.set(students.find((s) => s.uid === uid) ?? null);
      this.submissions.set(subs);
      this.guideProgress.set(progress);
      this.achievements.set(sortAchievements(achs));
    } finally {
      this.loading.set(false);
    }
  }

  protected getEventName(practiceEventId: string): string {
    return this.resourceService.getGuideBySlug(practiceEventId)?.title ?? practiceEventId;
  }

  protected getGuideName(resourceId: string): string {
    const all = this.resourceService.getAllGuides(true);
    return all.find((g) => g.id === resourceId)?.title ?? resourceId;
  }

  protected formatDate(ts: Timestamp | null): string {
    if (!ts) return '—';
    return ts.toDate().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  protected goBack(): void {
    this.router.navigate(['/coach/students']);
  }

  protected getAchievementTitle(ach: Achievement): string {
    return getTemplate(ach.templateId)?.title ?? ach.templateId;
  }

  protected getAchievementDesc(ach: Achievement): string {
    return getTemplate(ach.templateId)?.description ?? '';
  }

  protected async assignAchievement(templateId: string): Promise<void> {
    const uid = this.id();
    await this.achievementService.assign(uid, templateId);
    const achs = await this.achievementService.getAchievementsForStudent(uid);
    this.achievements.set(sortAchievements(achs));
  }

  protected async removeAchievement(ach: Achievement): Promise<void> {
    if (!ach.id) return;
    await this.achievementService.remove(ach.id);
    this.achievements.update((list) => list.filter((a) => a.id !== ach.id));
  }

  protected async resetGuideProgress(resourceId: string): Promise<void> {
    const uid = this.id();
    await this.studentService.resetStudentProgress(uid, resourceId);
    this.guideProgress.update((list) => list.filter((p) => p.resourceId !== resourceId));
  }
}
