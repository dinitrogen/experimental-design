import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-change-password-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Set Your Password</h2>

    <mat-dialog-content>
      <p class="dialog-message">
        Welcome! Please set a new password to secure your account.
      </p>

      <form [formGroup]="form" (ngSubmit)="submit()" id="change-password-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>New Password</mat-label>
          <input
            matInput
            formControlName="newPassword"
            [type]="hideNew() ? 'password' : 'text'"
            autocomplete="new-password"
          />
          <button
            mat-icon-button
            matSuffix
            type="button"
            (click)="hideNew.update((v) => !v)"
            [attr.aria-label]="hideNew() ? 'Show password' : 'Hide password'"
          >
            <mat-icon>{{ hideNew() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (form.controls.newPassword.hasError('required')) {
            <mat-error>Password is required</mat-error>
          } @else if (form.controls.newPassword.hasError('minlength')) {
            <mat-error>Password must be at least 6 characters</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Confirm Password</mat-label>
          <input
            matInput
            formControlName="confirmPassword"
            [type]="hideConfirm() ? 'password' : 'text'"
            autocomplete="new-password"
          />
          <button
            mat-icon-button
            matSuffix
            type="button"
            (click)="hideConfirm.update((v) => !v)"
            [attr.aria-label]="hideConfirm() ? 'Show password' : 'Hide password'"
          >
            <mat-icon>{{ hideConfirm() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (form.controls.confirmPassword.hasError('required')) {
            <mat-error>Please confirm your password</mat-error>
          } @else if (form.controls.confirmPassword.hasError('passwordMismatch')) {
            <mat-error>Passwords do not match</mat-error>
          }
        </mat-form-field>

        @if (errorMessage()) {
          <p class="error-text" role="alert">{{ errorMessage() }}</p>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button
        mat-flat-button
        color="primary"
        type="submit"
        form="change-password-form"
        [disabled]="saving() || form.invalid"
      >
        @if (saving()) {
          <mat-spinner diameter="20" />
        } @else {
          Set Password
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .dialog-message {
      color: #555;
      margin: 0 0 16px;
      line-height: 1.5;
    }

    .full-width {
      width: 100%;
      margin-bottom: 4px;
    }

    form {
      min-width: 320px;
    }

    .error-text {
      color: var(--mat-sys-error, #d32f2f);
      font-size: 14px;
      margin: 0 0 8px;
    }
  `,
})
export class ChangePasswordDialogComponent {
  private readonly authService = inject(AuthService);
  private readonly dialogRef = inject(MatDialogRef<ChangePasswordDialogComponent>);
  private readonly fb = inject(FormBuilder);

  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly hideNew = signal(true);
  protected readonly hideConfirm = signal(true);

  protected readonly form = this.fb.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, this.matchPassword.bind(this)]],
  });

  private matchPassword(control: AbstractControl): ValidationErrors | null {
    const password = this.form?.controls.newPassword.value ?? '';
    return control.value !== password ? { passwordMismatch: true } : null;
  }

  protected async submit(): Promise<void> {
    // Re-validate confirm field in case password changed after confirm was typed
    this.form.controls.confirmPassword.updateValueAndValidity();
    if (this.form.invalid) return;

    this.saving.set(true);
    this.errorMessage.set('');

    try {
      const { newPassword } = this.form.getRawValue();
      await this.authService.changePassword(newPassword);
      this.dialogRef.close(true);
    } catch (err: unknown) {
      this.errorMessage.set(
        err instanceof Error ? err.message : 'Failed to change password. Please try again.',
      );
    } finally {
      this.saving.set(false);
    }
  }
}
