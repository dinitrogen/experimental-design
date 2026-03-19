import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { StudentService } from '../../core/services/student.service';
import { AppUser } from '../../core/models/user.model';

@Component({
  selector: 'app-edit-student-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title>Edit Student</h2>

    <mat-dialog-content>
      <form [formGroup]="form" (ngSubmit)="submit()" id="edit-student-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Display Name</mat-label>
          <input matInput formControlName="displayName" autocomplete="name" />
          @if (form.controls.displayName.hasError('required')) {
            <mat-error>Name is required</mat-error>
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

        <mat-slide-toggle formControlName="excludeFromRoster">
          Exclude from team roster
        </mat-slide-toggle>

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
        form="edit-student-form"
        [disabled]="saving() || form.invalid"
      >
        @if (saving()) {
          <mat-spinner diameter="20" />
        } @else {
          Save
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
export class EditStudentDialogComponent {
  private readonly studentService = inject(StudentService);
  private readonly dialogRef = inject(MatDialogRef<EditStudentDialogComponent>);
  private readonly data: AppUser = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);

  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly grades = [6, 7, 8, 9, 10, 11, 12];

  protected readonly form = this.fb.nonNullable.group({
    displayName: [this.data.displayName, Validators.required],
    middleSchool: [this.data.middleSchool ?? ''],
    grade: [this.data.grade as number | null],
    excludeFromRoster: [this.data.excludeFromRoster ?? false],
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid) return;

    this.saving.set(true);
    this.errorMessage.set('');

    try {
      const { displayName, middleSchool, grade, excludeFromRoster } = this.form.getRawValue();
      await this.studentService.updateStudent(this.data.uid, {
        displayName,
        middleSchool: middleSchool || '',
        grade: grade ?? undefined,
        excludeFromRoster,
      });
      this.dialogRef.close({
        ...this.data,
        displayName,
        middleSchool: middleSchool || undefined,
        grade: grade ?? undefined,
        excludeFromRoster,
      } as AppUser);
    } catch (err: unknown) {
      this.errorMessage.set(
        err instanceof Error ? err.message : 'Failed to update student.',
      );
    } finally {
      this.saving.set(false);
    }
  }
}
