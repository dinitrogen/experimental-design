import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { StudentService } from '../../core/services/student.service';
import { AppUser } from '../../core/models/user.model';

export interface AssignTeamDialogData {
  practiceEventId: string;
  practiceEventTitle: string;
}

export interface AssignTeamDialogResult {
  memberUids: string[];
  memberNames: string[];
}

@Component({
  selector: 'app-assign-team-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>group_add</mat-icon>
      Assign Team to Event
    </h2>
    <mat-dialog-content>
      <p class="event-name">{{ data.practiceEventTitle }}</p>
      <p class="instructions">Select students who will work on this event together as a team.</p>

      @if (loading()) {
        <div class="loading">
          <mat-spinner diameter="32" />
        </div>
      } @else {
        <div class="student-list">
          @for (student of students(); track student.uid) {
            <label class="student-item">
              <mat-checkbox
                [checked]="selectedUids().has(student.uid)"
                (change)="toggleStudent(student.uid)"
              />
              <span>{{ student.displayName }}</span>
            </label>
          }
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="selectedUids().size < 2"
        (click)="confirm()"
      >
        Assign Team ({{ selectedUids().size }})
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    h2 { display: flex; align-items: center; gap: 8px; }
    .event-name { font-weight: 500; margin: 0 0 4px; }
    .instructions { color: #666; font-size: 14px; margin: 0 0 16px; }
    .loading { display: flex; justify-content: center; padding: 24px; }
    .student-list { display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto; }
    .student-item { display: flex; align-items: center; gap: 8px; cursor: pointer; }
  `,
})
export class AssignTeamDialogComponent implements OnInit {
  protected readonly data = inject<AssignTeamDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<AssignTeamDialogComponent>);
  private readonly studentService = inject(StudentService);

  protected readonly loading = signal(true);
  protected readonly students = signal<AppUser[]>([]);
  protected readonly selectedUids = signal<Set<string>>(new Set());

  async ngOnInit(): Promise<void> {
    const all = await this.studentService.getAllStudents();
    this.students.set(all.filter((s) => !s.excludeFromRoster));
    this.loading.set(false);
  }

  protected toggleStudent(uid: string): void {
    this.selectedUids.update((set) => {
      const next = new Set(set);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  protected confirm(): void {
    const uids = [...this.selectedUids()];
    const names = this.students()
      .filter((s) => uids.includes(s.uid))
      .map((s) => s.displayName);
    this.dialogRef.close({
      memberUids: uids,
      memberNames: names,
    } satisfies AssignTeamDialogResult);
  }
}
