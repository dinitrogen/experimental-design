import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AppUser } from '../../core/models/user.model';
import { SeasonRecord, SeasonService } from '../../core/services/season.service';
import { StudentService } from '../../core/services/student.service';
import { ActiveSeasonChipComponent } from '../../shared/components/active-season-chip';
interface RosterChange {
  uid: string;
  enrolled: boolean;
}

@Component({
  selector: 'app-season-roster',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    ActiveSeasonChipComponent,
  ],
  template: `
    <div class="content-container">
      <div class="page-header">
        <h1 class="page-title">Season Roster</h1>
        <app-active-season-chip />
      </div>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48" />
        </div>
      } @else if (seasons().length === 0) {
        <mat-card>
          <mat-card-content>
            <p>No seasons yet. Start one from <a routerLink="/coach/season">Season Rollover</a>.</p>
          </mat-card-content>
        </mat-card>
      } @else {
        <mat-card class="section">
          <mat-card-content>
            <mat-form-field appearance="outline">
              <mat-label>Season</mat-label>
              <mat-select [value]="selectedSeason()" (selectionChange)="selectSeason($event.value)">
                @for (season of seasons(); track season.id) {
                  <mat-option [value]="season.id">{{ season.id }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <p class="muted">
              Check students to enroll them in {{ selectedSeason() }}. Students who are archived
              must be restored in <a routerLink="/coach/students">Student Management</a> before they
              can be enrolled.
            </p>
          </mat-card-content>
        </mat-card>

        <mat-card class="section">
          <mat-card-content>
            @for (student of students(); track student.uid) {
              <div class="student-row">
                <mat-checkbox
                  [checked]="draft().has(student.uid)"
                  [disabled]="student.status === 'archived' || busy()"
                  (change)="toggle(student.uid, $event.checked)"
                >
                  {{ student.displayName || student.email }}
                </mat-checkbox>
                @if (student.status === 'archived') {
                  <span class="muted">Archived</span>
                }
              </div>
            } @empty {
              <p>No students yet.</p>
            }

            <div class="actions">
              <button
                mat-raised-button
                type="button"
                [disabled]="changes().length === 0 || busy()"
                (click)="save()"
              >
                Save roster
              </button>
              @if (changes().length > 0) {
                <span class="muted">{{ changes().length }} unsaved change(s)</span>
              }
            </div>
          </mat-card-content>
        </mat-card>
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
    .student-row { display: flex; align-items: center; gap: 12px; min-height: 40px; }
    .muted { color: var(--mat-sys-on-surface-variant, #5f6368); font-size: 0.875rem; }
    .actions { margin-top: 16px; display: flex; align-items: center; gap: 12px; }
  `,
})
export class SeasonRosterComponent {
  private readonly studentService = inject(StudentService);
  private readonly seasonService = inject(SeasonService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly students = signal<AppUser[]>([]);
  readonly seasons = signal<SeasonRecord[]>([]);
  readonly selectedSeason = signal('');

  // Enrollment in the selected season as stored, and as edited on this page.
  private readonly saved = signal<Set<string>>(new Set());
  readonly draft = signal<Set<string>>(new Set());

  readonly changes = computed<RosterChange[]>(() => {
    const draft = this.draft();
    const saved = this.saved();
    const uids = new Set([...draft, ...saved]);
    return [...uids]
      .filter((uid) => draft.has(uid) !== saved.has(uid))
      .map((uid) => ({ uid, enrolled: draft.has(uid) }));
  });

  constructor() {
    void this.load();
  }

  selectSeason(seasonId: string): void {
    this.selectedSeason.set(seasonId);
    this.resetDraft();
  }

  toggle(uid: string, enrolled: boolean): void {
    this.draft.update((current) => {
      const next = new Set(current);
      if (enrolled) next.add(uid);
      else next.delete(uid);
      return next;
    });
  }

  async save(): Promise<void> {
    const seasonId = this.selectedSeason();
    const changes = this.changes();
    if (!seasonId || changes.length === 0) return;

    this.busy.set(true);
    try {
      await Promise.all(
        changes.map((change) =>
          this.studentService.setSeasonEnrollment(change.uid, seasonId, change.enrolled),
        ),
      );
      this.snackBar.open(`Saved ${changes.length} change(s) for ${seasonId}.`, 'Close', {
        duration: 5000,
      });
      await this.load();
    } catch (error) {
      this.notify(error, 'Could not save the roster. Reload and try again.');
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
      this.students.set(students);
      this.seasons.set(seasons);
      // Keep the current selection if it still exists, otherwise use the newest season.
      const stillValid = seasons.some((season) => season.id === this.selectedSeason());
      this.selectedSeason.set(stillValid ? this.selectedSeason() : (seasons[0]?.id ?? ''));
      this.resetDraft();
    } catch (error) {
      this.notify(error, 'Could not load the roster.');
    } finally {
      this.loading.set(false);
    }
  }

  private resetDraft(): void {
    const seasonId = this.selectedSeason();
    const enrolled = new Set(
      this.students()
        .filter((student) => student.enrolledSeasons?.includes(seasonId))
        .map((student) => student.uid),
    );
    this.saved.set(enrolled);
    this.draft.set(new Set(enrolled));
  }

  private notify(error: unknown, fallback: string): void {
    const message = error instanceof Error && error.message ? error.message : fallback;
    this.snackBar.open(message, 'Close', { duration: 8000 });
  }
}
