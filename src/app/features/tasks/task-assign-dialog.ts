import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { StudentService } from '../../core/services/student.service';
import { AppUser } from '../../core/models/user.model';

export interface TaskAssignDialogData {
  taskTitle: string;
  currentUids: string[];
}

export interface TaskAssignDialogResult {
  selectedUids: string[];
}

@Component({
  selector: 'app-task-assign-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Assign Students</h2>

    <mat-dialog-content>
      <p class="dialog-subtitle">Select students for <strong>{{ data.taskTitle }}</strong></p>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="32" />
        </div>
      } @else if (students().length === 0) {
        <p class="empty-text">No students found.</p>
      } @else {
        <div class="select-all">
          <mat-checkbox
            [checked]="allSelected()"
            [indeterminate]="someSelected() && !allSelected()"
            (change)="toggleAll($event.checked)"
            aria-label="Select all students"
          >
            Select All ({{ students().length }})
          </mat-checkbox>
        </div>
        <div class="student-list" role="group" aria-label="Student selection">
          @for (student of students(); track student.uid) {
            <mat-checkbox
              [checked]="selectedUids().has(student.uid)"
              (change)="toggle(student.uid, $event.checked)"
            >
              {{ student.displayName }}
            </mat-checkbox>
          }
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="loading() || selectedUids().size === 0"
        (click)="confirm()"
      >
        Assign ({{ selectedUids().size }})
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .dialog-subtitle {
      margin: 0 0 16px;
      color: #666;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 24px;
    }

    .empty-text {
      text-align: center;
      color: #999;
      padding: 16px;
    }

    .select-all {
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }

    .student-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 300px;
      overflow-y: auto;
    }
  `,
})
export class TaskAssignDialog implements OnInit {
  protected readonly data = inject<TaskAssignDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TaskAssignDialog, TaskAssignDialogResult>);
  private readonly studentService = inject(StudentService);

  protected readonly loading = signal(true);
  protected readonly students = signal<AppUser[]>([]);
  protected readonly selectedUids = signal(new Set<string>(this.data.currentUids));

  protected allSelected(): boolean {
    return this.students().length > 0 && this.selectedUids().size === this.students().length;
  }

  protected someSelected(): boolean {
    return this.selectedUids().size > 0;
  }

  async ngOnInit(): Promise<void> {
    try {
      const students = await this.studentService.getAllStudents();
      this.students.set(students);
    } finally {
      this.loading.set(false);
    }
  }

  protected toggle(uid: string, checked: boolean): void {
    const next = new Set(this.selectedUids());
    if (checked) {
      next.add(uid);
    } else {
      next.delete(uid);
    }
    this.selectedUids.set(next);
  }

  protected toggleAll(checked: boolean): void {
    if (checked) {
      this.selectedUids.set(new Set(this.students().map((s) => s.uid)));
    } else {
      this.selectedUids.set(new Set());
    }
  }

  protected confirm(): void {
    this.dialogRef.close({ selectedUids: [...this.selectedUids()] });
  }
}
