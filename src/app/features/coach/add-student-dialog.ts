import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { StudentService } from '../../core/services/student.service';

@Component({
  selector: 'app-add-student-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>Add Student</h2>

    <mat-dialog-content>
      <form [formGroup]="form" (ngSubmit)="submit()" id="add-student-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Display Name</mat-label>
          <input matInput formControlName="displayName" autocomplete="name" />
          @if (form.controls.displayName.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Username</mat-label>
          <input matInput formControlName="username" autocomplete="username" />
          @if (form.controls.username.hasError('required')) {
            <mat-error>Username is required</mat-error>
          } @else if (form.controls.username.hasError('pattern')) {
            <mat-error>Letters, numbers, dots, and underscores only</mat-error>
          }
          <mat-hint>Student logs in with this username</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Password</mat-label>
          <input matInput formControlName="password" type="password" autocomplete="new-password" />
          @if (form.controls.password.hasError('required')) {
            <mat-error>Password is required</mat-error>
          } @else if (form.controls.password.hasError('minlength')) {
            <mat-error>Password must be at least 6 characters</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>School</mat-label>
          <input matInput formControlName="middleSchool" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Grade</mat-label>
          <mat-select formControlName="grade">
            @for (g of grades; track g) {
              <mat-option [value]="g">{{ g }}th Grade</mat-option>
            }
          </mat-select>
        </mat-form-field>

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
        type="submit"
        form="add-student-form"
        [disabled]="saving() || form.invalid"
      >
        @if (saving()) {
          <mat-spinner diameter="20" />
        } @else {
          Create
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    mat-dialog-content {
      min-width: 320px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 4px;
    }

    form {
      padding-top: 8px;
    }

    .error-text {
      color: var(--mat-sys-error, #d32f2f);
      font-size: 14px;
      margin: 0 0 8px;
    }
  `,
})
export class AddStudentDialogComponent {
  private readonly studentService = inject(StudentService);
  private readonly dialogRef = inject(MatDialogRef<AddStudentDialogComponent>);
  private readonly fb = inject(FormBuilder);

  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly grades = [6, 7, 8, 9, 10, 11, 12];

  protected readonly form = this.fb.nonNullable.group({
    displayName: ['', Validators.required],
    username: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._]+$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    middleSchool: [''],
    grade: [null as number | null],
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid) return;

    this.saving.set(true);
    this.errorMessage.set('');

    try {
      const { displayName, username, password, middleSchool, grade } = this.form.getRawValue();
      const email = `${username}@exd-lab.app`;
      const newStudent = await this.studentService.createStudent(
        email,
        password,
        displayName,
        middleSchool || undefined,
        grade ?? undefined,
      );
      this.dialogRef.close(newStudent);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create student account.';
      if (message.includes('EMAIL_EXISTS')) {
        this.errorMessage.set('An account with that email already exists.');
      } else {
        this.errorMessage.set(message);
      }
    } finally {
      this.saving.set(false);
    }
  }
}
