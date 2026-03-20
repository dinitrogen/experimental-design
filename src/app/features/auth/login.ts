import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { ChangePasswordDialogComponent } from '../../shared/components/change-password-dialog';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  template: `
    <div class="login-wrapper">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="header-icon">science</mat-icon>
          <mat-card-title>XD Lab</mat-card-title>
          <mat-card-subtitle>Science Olympiad — Experimental Design</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Username</mat-label>
              <input
                matInput
                formControlName="username"
                autocomplete="username"
              />
              @if (loginForm.controls.username.hasError('required')) {
                <mat-error>Username is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input
                matInput
                formControlName="password"
                [type]="hidePassword() ? 'password' : 'text'"
                autocomplete="current-password"
              />
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="hidePassword.update((v) => !v)"
                [attr.aria-label]="hidePassword() ? 'Show password' : 'Hide password'"
                [matTooltip]="hidePassword() ? 'Show password' : 'Hide password'"
              >
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (loginForm.controls.password.hasError('required')) {
                <mat-error>Password is required</mat-error>
              }
            </mat-form-field>

            @if (errorMessage()) {
              <p class="error-text" role="alert">{{ errorMessage() }}</p>
            }

            <button
              mat-flat-button
              type="submit"
              class="full-width login-button"
              [disabled]="submitting()"
            >
              @if (submitting()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Sign In
              }
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .login-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: var(--login-gradient);
      padding: 16px;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 24px;
    }

    .header-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--login-icon-color);
    }

    .full-width {
      width: 100%;
    }

    .login-button {
      margin-top: 8px;
      height: 48px;
    }

    .error-text {
      color: #d32f2f;
      font-size: 14px;
      margin: 0 0 8px;
    }

    form {
      display: flex;
      flex-direction: column;
      margin-top: 16px;
    }
  `,
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);

  protected readonly hidePassword = signal(true);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly loginForm = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    const { username, password } = this.loginForm.getRawValue();
    // Append domain if the user typed a plain username (not a full email)
    const email = username.includes('@') ? username : `${username}@exd-lab.app`;

    try {
      await this.authService.login(email, password);

      // Prompt first-time users to change their password
      if (this.authService.needsPasswordChange()) {
        const dialogRef = this.dialog.open(ChangePasswordDialogComponent, {
          width: '420px',
          disableClose: true,
        });
        await dialogRef.afterClosed().toPromise();
      }

      const isCoach = this.authService.isCoach();
      await this.router.navigate([isCoach ? '/coach' : '/dashboard']);
    } catch {
      this.errorMessage.set('Invalid username or password. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }
}
