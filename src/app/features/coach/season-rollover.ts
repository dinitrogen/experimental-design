import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormRecord, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { startWith } from 'rxjs';
import { AppUser } from '../../core/models/user.model';
import {
  RolloverAction,
  RolloverPreview,
  SeasonRecord,
  SeasonService,
} from '../../core/services/season.service';
import { StudentService } from '../../core/services/student.service';
import { ActiveSeasonChipComponent } from '../../shared/components/active-season-chip';

// Mirrors the server-side rule in functions/src/index.ts.
const SEASON_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{2,39}$/;

const ACTION_LABELS: Record<RolloverAction, string> = {
  enroll: 'Stays active and is enrolled in the new season',
  reactivate: 'Login restored and enrolled in the new season',
  archive: 'Will be archived and blocked from signing in',
  none: 'Stays archived',
};

const COUNT_LABELS: Record<keyof RolloverPreview['counts'], string> = {
  progress: 'Study guide progress records',
  loginHistory: 'Login streak records',
  submissions: 'Practice reports',
  taskSubmissions: 'Task submissions',
  taskAssignments: 'Task assignment settings',
  teamEvents: 'Team planner events (archived copies)',
  returningMemberAwards: 'Returning Member awards',
};

interface StudentRow {
  student: AppUser;
  returning: FormControl<boolean>;
}

interface PreviewState {
  seasonId: string;
  uids: string[];
  planKey: string;
  result: RolloverPreview;
}

@Component({
  selector: 'app-season-rollover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    ActiveSeasonChipComponent,
  ],
  template: `
    <div class="content-container">
      <div class="page-header">
        <h1 class="page-title">Season Rollover</h1>
        <app-active-season-chip />
      </div>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48" />
        </div>
      } @else {
        <mat-card class="section">
          <mat-card-content>
            <p>Starting a new season does the following:</p>
            <ul>
              <li>Archives study guide progress, login streaks, practice reports, task work, and task assignments. Nothing is deleted without an archive copy.</li>
              <li>Re-enrolls returning students and restores their login if they were archived.</li>
              <li>Archives every other active student, which blocks their sign-in.</li>
              <li>Keeps achievements, student accounts, team planning, and guide visibility settings.</li>
            </ul>
            <p class="warning">
              <mat-icon>warning</mat-icon>
              Ask students to sign out first, and take a backup before the real run:
              <code>scripts/backup-firestore.ps1 -Label pre-rollover</code>
            </p>
          </mat-card-content>
        </mat-card>

        <mat-card class="section">
          <mat-card-header>
            <mat-card-title>1. New season</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Season ID</mat-label>
              <input matInput [formControl]="form.controls.seasonId" placeholder="2026-2027" />
              <mat-hint>3-40 letters, numbers, or hyphens</mat-hint>
            </mat-form-field>
          </mat-card-content>
        </mat-card>

        <mat-card class="section">
          <mat-card-header>
            <mat-card-title>2. Returning students</mat-card-title>
            <mat-card-subtitle>
              Checked students are re-enrolled. Unchecked students who are currently active will be archived.
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (rows().length === 0) {
              <p>No students found.</p>
            }
            @for (row of rows(); track row.student.uid) {
              <div class="student-row">
                <mat-checkbox [formControl]="row.returning">
                  {{ row.student.displayName || row.student.email }}
                </mat-checkbox>
                @if (row.student.status === 'archived') {
                  <span class="muted">Currently archived</span>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>

        <mat-card class="section">
          <mat-card-header>
            <mat-card-title>3. Backup and preview</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-checkbox [formControl]="form.controls.backupConfirmed">
              I have taken a fresh Firestore backup for this rollover
            </mat-checkbox>
            <div class="actions">
              <button
                mat-stroked-button
                type="button"
                [disabled]="busy() || form.controls.seasonId.invalid"
                (click)="previewRollover()"
              >
                <mat-icon>visibility</mat-icon>
                Preview changes
              </button>
            </div>
            @if (form.controls.seasonId.touched && form.controls.seasonId.invalid) {
              <p class="error">Enter a season ID of 3-40 letters, numbers, or hyphens.</p>
            }
          </mat-card-content>
        </mat-card>

        @if (preview(); as p) {
          <mat-card class="section">
            <mat-card-header>
              <mat-card-title>Preview for {{ p.result.seasonId }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if (p.result.existingStatus === 'complete') {
                <p class="error">This season has already been rolled over. Choose a different season ID.</p>
              } @else if (p.result.existingStatus === 'in_progress') {
                <p class="warning">
                  <mat-icon>info</mat-icon>
                  A previous run for this season did not finish. Running again resumes it.
                </p>
              }

              @if (!previewIsCurrent()) {
                <p class="warning">The selections changed. Preview again before running.</p>
              }

              <h3>Data to archive</h3>
              <ul>
                @for (entry of countRows(p.result); track entry.label) {
                  <li>{{ entry.label }}: {{ entry.value }}</li>
                }
              </ul>

              <h3>Student changes</h3>
              <ul class="student-plan">
                @for (student of p.result.students; track student.uid) {
                  <li>
                    <strong>{{ student.displayName }}</strong>: {{ actionLabel(student.action) }}
                  </li>
                }
              </ul>

              <div class="run-box">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Type {{ p.result.seasonId }} to confirm</mat-label>
                  <input matInput [formControl]="form.controls.confirmSeasonId" autocomplete="off" />
                </mat-form-field>
                <button
                  mat-raised-button
                  color="warn"
                  type="button"
                  [disabled]="!canRun() || busy()"
                  (click)="runRollover()"
                >
                  <mat-icon>autorenew</mat-icon>
                  Run rollover
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        }

        @if (seasons().length > 0) {
          <mat-card class="section">
            <mat-card-header>
              <mat-card-title>Past rollovers</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <ul>
                @for (season of seasons(); track season.id) {
                  <li>
                    {{ season.id }}: {{ season.status === 'complete' ? 'complete' : 'in progress' }}
                    @if (season.completedAt) {
                      ({{ season.completedAt | date: 'mediumDate' }})
                    }
                  </li>
                }
              </ul>
            </mat-card-content>
          </mat-card>
        }
      }
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
    .section { margin-bottom: 16px; }
    .full-width { width: 100%; }
    .student-row { display: flex; align-items: center; gap: 12px; }
    .muted { color: var(--mat-sys-on-surface-variant, #5f6368); font-size: 0.875rem; }
    .actions { margin-top: 12px; }
    .warning { display: flex; align-items: center; gap: 8px; color: #8a5a00; }
    .error { color: #b3261e; }
    .run-box { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; max-width: 480px; }
    .student-plan { padding-left: 20px; }
  `,
})
export class SeasonRolloverComponent {
  private readonly studentService = inject(StudentService);
  private readonly seasonService = inject(SeasonService);
  private readonly snackBar = inject(MatSnackBar);

  readonly form = new FormGroup({
    seasonId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(SEASON_ID_PATTERN)],
    }),
    backupConfirmed: new FormControl(false, {
      nonNullable: true,
      validators: [Validators.requiredTrue],
    }),
    confirmSeasonId: new FormControl('', { nonNullable: true }),
    returning: new FormRecord<FormControl<boolean>>({}),
  });

  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly rows = signal<StudentRow[]>([]);
  readonly seasons = signal<SeasonRecord[]>([]);
  readonly preview = signal<PreviewState | null>(null);

  private readonly formValue = toSignal(this.form.valueChanges.pipe(startWith(null)), {
    initialValue: null,
  });

  // Identifies the season and returning selection, so a preview can be checked for staleness.
  private readonly planKey = computed(() => {
    this.formValue();
    this.rows();
    return JSON.stringify([this.form.controls.seasonId.value, this.returningUids()]);
  });

  readonly previewIsCurrent = computed(() => this.preview()?.planKey === this.planKey());

  readonly canRun = computed(() => {
    this.formValue();
    const preview = this.preview();
    return (
      !!preview &&
      this.previewIsCurrent() &&
      preview.result.existingStatus !== 'complete' &&
      this.form.valid &&
      this.form.controls.confirmSeasonId.value === preview.seasonId
    );
  });

  constructor() {
    void this.load();
  }

  actionLabel(action: RolloverAction): string {
    return ACTION_LABELS[action];
  }

  countRows(preview: RolloverPreview): { label: string; value: number }[] {
    return (Object.keys(COUNT_LABELS) as (keyof RolloverPreview['counts'])[]).map((key) => ({
      label: COUNT_LABELS[key],
      value: preview.counts[key],
    }));
  }

  async previewRollover(): Promise<void> {
    if (this.form.controls.seasonId.invalid) {
      this.form.controls.seasonId.markAsTouched();
      return;
    }
    const seasonId = this.form.controls.seasonId.value;
    const uids = this.returningUids();
    const planKey = this.planKey();

    this.busy.set(true);
    try {
      const result = await this.seasonService.previewRollover(seasonId, uids);
      this.preview.set({ seasonId, uids, planKey, result });
    } catch (error) {
      this.notify(error, 'Preview failed.');
    } finally {
      this.busy.set(false);
    }
  }

  async runRollover(): Promise<void> {
    const preview = this.preview();
    if (!preview || !this.canRun()) return;

    this.busy.set(true);
    try {
      const result = await this.seasonService.runRollover({
        seasonId: preview.seasonId,
        returningUids: preview.uids,
        confirmSeasonId: this.form.controls.confirmSeasonId.value,
        backupConfirmed: this.form.controls.backupConfirmed.value,
      });
      this.snackBar.open(`Season ${result.seasonId} rollover complete.`, 'Close', { duration: 8000 });
      this.form.controls.confirmSeasonId.reset('');
      this.form.controls.backupConfirmed.reset(false);
      await this.load();
    } catch (error) {
      this.notify(error, 'Rollover did not finish. Preview again and run to resume it.');
    } finally {
      this.busy.set(false);
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [students, seasons] = await Promise.all([
        this.studentService.getAllStudents({ includeArchived: true }),
        this.seasonService.getSeasons(),
      ]);

      const returning = this.form.controls.returning;
      for (const uid of Object.keys(returning.controls)) {
        returning.removeControl(uid);
      }
      const rows = students.map((student) => {
        // Active students default to returning. Archived students default to not returning.
        const control = new FormControl(student.status !== 'archived', { nonNullable: true });
        returning.addControl(student.uid, control);
        return { student, returning: control };
      });

      this.rows.set(rows);
      this.seasons.set(seasons);
      this.preview.set(null);
    } catch (error) {
      this.notify(error, 'Could not load students.');
    } finally {
      this.loading.set(false);
    }
  }

  private returningUids(): string[] {
    return this.rows()
      .filter((row) => row.returning.value)
      .map((row) => row.student.uid);
  }

  private notify(error: unknown, fallback: string): void {
    const message = error instanceof Error && error.message ? error.message : fallback;
    this.snackBar.open(message, 'Close', { duration: 8000 });
  }
}
