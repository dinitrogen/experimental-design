import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface ResetPasswordDialogData {
  studentName: string;
}

@Component({
  selector: 'app-reset-password-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon>lock_reset</mat-icon>
      Reset Password
    </h2>

    <mat-dialog-content>
      <p>Set a temporary password for <strong>{{ data.studentName }}</strong>. They will be prompted to choose a new password on their next login.</p>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Temporary Password</mat-label>
        <input matInput [(ngModel)]="tempPassword" type="text" autocomplete="off" />
        <mat-hint>Minimum 6 characters</mat-hint>
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="tempPassword().length < 6"
        (click)="confirm()"
      >
        Reset Password
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    p {
      font-size: 15px;
      line-height: 1.5;
      margin: 0 0 16px;
    }

    .full-width {
      width: 100%;
    }
  `,
})
export class ResetPasswordDialogComponent {
  protected readonly data = inject<ResetPasswordDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ResetPasswordDialogComponent>);

  protected readonly tempPassword = signal('');

  protected confirm(): void {
    if (this.tempPassword().length >= 6) {
      this.dialogRef.close(this.tempPassword());
    }
  }
}
