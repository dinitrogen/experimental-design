import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PracticeSettingsService } from '../../core/services/practice-settings.service';

@Component({
  selector: 'app-practice-settings-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatSlideToggleModule,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>settings</mat-icon>
      Practice Settings
    </h2>

    <mat-dialog-content>
      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label">Show Hints</div>
          <div class="setting-desc">
            Display placeholder examples in input fields. Disable for a more realistic competition experience.
          </div>
        </div>
        <mat-slide-toggle
          [checked]="settings.showHints()"
          (change)="settings.update({ showHints: $event.checked })"
          aria-label="Show Hints"
        />
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label">Check My Work</div>
          <div class="setting-desc">
            Allow you to check your calculations in the statistics section. Disable for a more realistic event simulation.
          </div>
        </div>
        <mat-slide-toggle
          [checked]="settings.checkMyWork()"
          (change)="settings.update({ checkMyWork: $event.checked })"
          aria-label="Check My Work"
        />
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Done</button>
    </mat-dialog-actions>
  `,
  styles: `
    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    mat-dialog-content {
      min-width: 340px;
    }

    .setting-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .setting-row:last-child {
      border-bottom: none;
    }

    .setting-info {
      flex: 1;
    }

    .setting-label {
      font-weight: 500;
      margin-bottom: 2px;
    }

    .setting-desc {
      font-size: 13px;
      color: #666;
      line-height: 1.4;
    }
  `,
})
export class PracticeSettingsDialogComponent {
  protected readonly settings = inject(PracticeSettingsService);
}
