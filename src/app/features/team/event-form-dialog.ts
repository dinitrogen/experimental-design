import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Timestamp } from '@angular/fire/firestore';
import { TeamService } from '../../core/services/team.service';
import { StudentService } from '../../core/services/student.service';
import { AppUser } from '../../core/models/user.model';
import { TeamEvent } from '../../core/models/team-event.model';

@Component({
  selector: 'app-event-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit Event' : 'Add New Event' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" id="event-form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Event Title</mat-label>
          <input matInput formControlName="title" />
          @if (form.controls.title.hasError('required')) {
            <mat-error>Title is required</mat-error>
          }
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Location</mat-label>
            <input matInput formControlName="location" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Date</mat-label>
            <input matInput formControlName="eventDate" type="date" />
          </mat-form-field>
        </div>

        <!-- Teams -->
        <div formArrayName="teams">
          @for (team of teamsArray.controls; track $index; let i = $index) {
            <mat-divider />
            <div class="team-section" [formGroupName]="i">
              <div class="team-header">
                <h3>Team {{ i + 1 }}</h3>
                @if (teamsArray.length > 1) {
                  <button
                    mat-icon-button
                    color="warn"
                    type="button"
                    (click)="removeTeam(i)"
                    [attr.aria-label]="'Remove team ' + (i + 1)"
                  >
                    <mat-icon>close</mat-icon>
                  </button>
                }
              </div>

              <div class="row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>School Name</mat-label>
                  <input matInput formControlName="schoolName" />
                  @if (team.get('schoolName')?.hasError('required')) {
                    <mat-error>School name is required</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Team Name (optional)</mat-label>
                  <input matInput formControlName="teamName" />
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Team Members (select 3)</mat-label>
                <mat-select formControlName="memberUids" multiple>
                  @for (s of students(); track s.uid) {
                    <mat-option [value]="s.uid">{{ s.displayName }}</mat-option>
                  }
                </mat-select>
                @if (team.get('memberUids')?.hasError('required')) {
                  <mat-error>Select at least 1 member</mat-error>
                }
              </mat-form-field>
            </div>
          }
        </div>

        <button mat-stroked-button type="button" (click)="addTeam()" class="add-team-btn">
          <mat-icon>add</mat-icon>
          Add Team
        </button>

        <mat-divider />

        <!-- Alternates -->
        <div class="alternates-section">
          <h3>Alternates (optional)</h3>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Alternate Students</mat-label>
            <mat-select formControlName="alternateUids" multiple>
              @for (s of students(); track s.uid) {
                <mat-option [value]="s.uid">{{ s.displayName }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        @if (errorMessage()) {
          <p class="error-text" role="alert">{{ errorMessage() }}</p>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="saving()">Cancel</button>
      <button
        mat-raised-button
        color="primary"
        type="button"
        (click)="submit()"
        [disabled]="saving() || form.invalid"
      >
        @if (saving()) {
          <mat-spinner diameter="20" />
        } @else {
          {{ isEdit ? 'Save' : 'Create' }}
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    mat-dialog-content {
      min-width: 480px;
      max-height: 70vh;
    }

    .dialog-form {
      padding-top: 12px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 4px;
    }

    .half-width {
      flex: 1;
    }

    .row {
      display: flex;
      gap: 12px;
    }

    .team-section {
      padding: 16px 0 8px;
    }

    .team-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .team-header h3 {
      margin: 0 0 8px;
      color: #1565c0;
    }

    .add-team-btn {
      margin: 8px 0 16px;
    }

    .alternates-section {
      padding-top: 16px;
    }

    .alternates-section h3 {
      margin: 0 0 8px;
      color: #666;
    }

    .error-text {
      color: var(--mat-sys-error, #d32f2f);
      font-size: 14px;
      margin: 0 0 8px;
    }
  `,
})
export class EventFormDialogComponent implements OnInit {
  private readonly teamService = inject(TeamService);
  private readonly studentService = inject(StudentService);
  private readonly dialogRef = inject(MatDialogRef<EventFormDialogComponent>);
  private readonly fb = inject(FormBuilder);
  protected readonly existingEvent: TeamEvent | null = inject(MAT_DIALOG_DATA, { optional: true });

  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly students = signal<AppUser[]>([]);
  protected readonly isEdit = !!this.existingEvent?.id;

  protected readonly form = this.fb.group({
    title: [this.existingEvent?.title ?? '', Validators.required],
    location: [this.existingEvent?.location ?? ''],
    eventDate: [this.existingEvent?.eventDate ?? ''],
    teams: this.fb.array<FormGroup>([], Validators.required),
    alternateUids: [this.existingEvent?.alternateUids ?? [] as string[]],
  });

  get teamsArray(): FormArray<FormGroup> {
    return this.form.controls.teams;
  }

  async ngOnInit(): Promise<void> {
    const allStudents = await this.studentService.getAllStudents();
    this.students.set(allStudents);

    if (this.existingEvent?.teams?.length) {
      for (const t of this.existingEvent.teams) {
        this.addTeam(t.schoolName, t.teamName, t.memberUids);
      }
    } else {
      this.addTeam();
    }
  }

  protected addTeam(schoolName = '', teamName = '', memberUids: string[] = []): void {
    this.teamsArray.push(
      this.fb.group({
        schoolName: [schoolName, Validators.required],
        teamName: [teamName],
        memberUids: [memberUids, Validators.required],
      }),
    );
  }

  protected removeTeam(index: number): void {
    this.teamsArray.removeAt(index);
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.errorMessage.set('');

    try {
      const v = this.form.getRawValue();
      const event: TeamEvent = {
        id: this.existingEvent?.id,
        title: v.title!,
        location: v.location || undefined,
        eventDate: v.eventDate || undefined,
        teams: v.teams.map((t) => ({
          schoolName: t['schoolName'],
          teamName: t['teamName'] || undefined,
          memberUids: t['memberUids'],
          roleAssignments: this.existingEvent?.teams?.find(
            (et) => et.schoolName === t['schoolName'] && et.teamName === t['teamName'],
          )?.roleAssignments ?? {},
        })),
        alternateUids: v.alternateUids ?? [],
        createdAt: this.existingEvent?.createdAt ?? Timestamp.now(),
      };

      const id = await this.teamService.saveTeamEvent(event);
      this.dialogRef.close({ ...event, id });
    } catch (err: unknown) {
      this.errorMessage.set(
        err instanceof Error ? err.message : 'Failed to save event.',
      );
    } finally {
      this.saving.set(false);
    }
  }
}
