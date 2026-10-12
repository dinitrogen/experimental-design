import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { StudentService } from '../../core/services/student.service';
import { AppUser } from '../../core/models/user.model';
import { AddStudentDialogComponent } from './add-student-dialog';
import { EditStudentDialogComponent } from './edit-student-dialog';
import { ResetPasswordDialogComponent } from './reset-password-dialog';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog';

function sortByName(students: AppUser[]): AppUser[] {
  return [...students].sort((a, b) => a.displayName.localeCompare(b.displayName));
}

@Component({
  selector: 'app-student-management',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  template: `
    <div class="content-container">
      <div class="page-header">
        <h1 class="page-title">Student Management</h1>
        <button mat-raised-button color="primary" (click)="openAddDialog()">
          <mat-icon>person_add</mat-icon>
          Add Student
        </button>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48" />
        </div>
      } @else if (students().length === 0 && archivedStudents().length === 0) {
        <mat-card>
          <mat-card-content class="empty-state">
            <mat-icon>people_outline</mat-icon>
            <h2>No Students Yet</h2>
            <p>Add your first student to get started.</p>
            <button mat-raised-button color="primary" (click)="openAddDialog()">
              <mat-icon>person_add</mat-icon>
              Add Student
            </button>
          </mat-card-content>
        </mat-card>
      } @else {
        @if (students().length === 0) {
          <p class="empty-note">No active students. Add one, or restore an archived student below.</p>
        } @else {
          <mat-card>
            <table mat-table [dataSource]="students()" class="student-table">
              <ng-container matColumnDef="displayName">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let student">{{ student.displayName }}</td>
              </ng-container>

              <ng-container matColumnDef="username">
                <th mat-header-cell *matHeaderCellDef>Username</th>
                <td mat-cell *matCellDef="let student">{{ extractUsername(student.email) }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let student">
                  <button
                    mat-icon-button
                    (click)="openEditDialog(student)"
                    [attr.aria-label]="'Edit ' + student.displayName"
                    matTooltip="Edit student"
                  >
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    (click)="resetPassword(student)"
                    [attr.aria-label]="'Reset password for ' + student.displayName"
                    matTooltip="Reset password"
                  >
                    <mat-icon>lock_reset</mat-icon>
                  </button>
                  <a
                    mat-icon-button
                    [routerLink]="['/coach/students', student.uid]"
                    aria-label="View student details"
                    matTooltip="View details"
                  >
                    <mat-icon>visibility</mat-icon>
                  </a>
                  <button
                    mat-icon-button
                    (click)="archiveStudent(student)"
                    [attr.aria-label]="'Archive ' + student.displayName"
                    matTooltip="Archive student"
                  >
                    <mat-icon>archive</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>
          </mat-card>
        }

        @if (archivedStudents().length > 0) {
          <h2 class="section-title">Archived Students</h2>
          <mat-card>
            <table mat-table [dataSource]="archivedStudents()" class="student-table">
              <ng-container matColumnDef="displayName">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let student">{{ student.displayName }}</td>
              </ng-container>

              <ng-container matColumnDef="username">
                <th mat-header-cell *matHeaderCellDef>Username</th>
                <td mat-cell *matCellDef="let student">{{ extractUsername(student.email) }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let student">
                  <a
                    mat-icon-button
                    [routerLink]="['/coach/students', student.uid]"
                    aria-label="View student details"
                    matTooltip="View details"
                  >
                    <mat-icon>visibility</mat-icon>
                  </a>
                  <button
                    mat-icon-button
                    (click)="reactivateStudent(student)"
                    [attr.aria-label]="'Restore ' + student.displayName"
                    matTooltip="Restore student"
                  >
                    <mat-icon>unarchive</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
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
      justify-content: space-between;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .page-header .page-title {
      margin: 0;
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

    .student-table {
      width: 100%;
    }

    .section-title {
      margin: 32px 0 16px;
      font-size: 1.25rem;
    }

    .empty-note {
      color: #666;
    }
  `,
})
export class StudentManagementComponent {
  private readonly studentService = inject(StudentService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly students = signal<AppUser[]>([]);
  protected readonly archivedStudents = signal<AppUser[]>([]);
  protected readonly loading = signal(true);
  protected readonly displayedColumns = ['displayName', 'username', 'actions'];

  constructor() {
    this.loadStudents();
  }

  private async loadStudents(): Promise<void> {
    try {
      this.loading.set(true);
      const all = await this.studentService.getAllStudents({ includeArchived: true });
      this.students.set(all.filter((s) => s.status !== 'archived'));
      this.archivedStudents.set(all.filter((s) => s.status === 'archived'));
    } finally {
      this.loading.set(false);
    }
  }

  protected openAddDialog(): void {
    const dialogRef = this.dialog.open(AddStudentDialogComponent, {
      width: '420px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result: AppUser | undefined) => {
      if (result) {
        this.students.update((list) => [...list, result]);
        this.snackBar.open(`Student "${result.displayName}" created!`, 'OK', { duration: 3000 });
      }
    });
  }

  protected openEditDialog(student: AppUser): void {
    const dialogRef = this.dialog.open(EditStudentDialogComponent, {
      width: '420px',
      disableClose: true,
      data: student,
    });

    dialogRef.afterClosed().subscribe((result: AppUser | undefined) => {
      if (result) {
        this.students.update((list) =>
          list.map((s) => (s.uid === result.uid ? result : s))
        );
        this.snackBar.open(`Updated "${result.displayName}".`, 'OK', { duration: 3000 });
      }
    });
  }

  protected archiveStudent(student: AppUser): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Archive Student',
        message: `Archive "${student.displayName}"? They will no longer be able to log in. Their progress, submissions, and achievements are kept, and you can restore them later.`,
        confirmText: 'Archive',
        confirmColor: 'warn',
        icon: 'archive',
      },
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) return;
      try {
        await this.studentService.archiveStudent(student.uid);
        this.students.update((list) => list.filter((s) => s.uid !== student.uid));
        this.archivedStudents.update((list) => sortByName([...list, { ...student, status: 'archived' }]));
        this.snackBar.open(`Archived "${student.displayName}".`, 'OK', { duration: 3000 });
      } catch {
        this.snackBar.open('Failed to archive student. Please try again.', 'OK', { duration: 5000 });
      }
    });
  }

  protected async reactivateStudent(student: AppUser): Promise<void> {
    try {
      await this.studentService.reactivateStudent(student.uid);
      this.archivedStudents.update((list) => list.filter((s) => s.uid !== student.uid));
      this.students.update((list) => sortByName([...list, { ...student, status: 'active', archivedAt: undefined }]));
      this.snackBar.open(`Restored "${student.displayName}".`, 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Failed to restore student. Please try again.', 'OK', { duration: 5000 });
    }
  }

  protected extractUsername(email: string): string {
    return email.replace(/@exd-lab\.app$/, '');
  }

  protected resetPassword(student: AppUser): void {
    const dialogRef = this.dialog.open(ResetPasswordDialogComponent, {
      width: '400px',
      data: { studentName: student.displayName },
    });

    dialogRef.afterClosed().subscribe(async (tempPassword: string | undefined) => {
      if (!tempPassword) return;
      try {
        await this.studentService.resetPassword(student.uid, tempPassword);
        this.snackBar.open(
          `Password reset for "${student.displayName}". They will be prompted to change it on next login.`,
          'OK',
          { duration: 5000 },
        );
      } catch {
        this.snackBar.open('Failed to reset password. Please try again.', 'OK', { duration: 5000 });
      }
    });
  }
}
