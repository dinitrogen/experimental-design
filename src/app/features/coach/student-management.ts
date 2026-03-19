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
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog';

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
      } @else if (students().length === 0) {
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
                  color="warn"
                  (click)="removeStudent(student)"
                  [attr.aria-label]="'Remove ' + student.displayName"
                  matTooltip="Remove student"
                >
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>
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
  `,
})
export class StudentManagementComponent {
  private readonly studentService = inject(StudentService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly students = signal<AppUser[]>([]);
  protected readonly loading = signal(true);
  protected readonly displayedColumns = ['displayName', 'username', 'actions'];

  constructor() {
    this.loadStudents();
  }

  private async loadStudents(): Promise<void> {
    try {
      this.loading.set(true);
      const students = await this.studentService.getAllStudents();
      this.students.set(students);
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

  protected removeStudent(student: AppUser): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Remove Student',
        message: `Remove "${student.displayName}" from the roster? This only removes them from the coach's view — their login still works.`,
        confirmText: 'Remove',
        confirmColor: 'warn',
        icon: 'warning',
      },
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) return;
      try {
        await this.studentService.removeStudent(student.uid);
        this.students.update((list) => list.filter((s) => s.uid !== student.uid));
        this.snackBar.open(`Removed "${student.displayName}".`, 'OK', { duration: 3000 });
      } catch {
        this.snackBar.open('Failed to remove student. Please try again.', 'OK', { duration: 5000 });
      }
    });
  }

  protected extractUsername(email: string): string {
    return email.replace(/@exd-lab\.app$/, '');
  }
}
