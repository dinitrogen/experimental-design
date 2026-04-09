import { ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { SubmissionService } from '../../core/services/submission.service';
import { SectionLock, REPORT_SECTION_KEYS } from '../../core/models/submission.model';

/** Human-friendly labels for section keys */
const SECTION_LABELS: Record<string, string> = {
  problemHypothesis: 'Problem & Hypothesis',
  variables: 'Variables',
  materialsProcedure: 'Materials & Procedure',
  observations: 'Qualitative Observations',
  dataTable: 'Data Table',
  graph: 'Graph',
  statistics: 'Statistics',
  errors: 'Experimental Errors',
  cer: 'CER Analysis',
  applications: 'Applications & Improvements',
};

export interface ManageLocksDialogData {
  submissionId: string;
}

@Component({
  selector: 'app-manage-locks-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>admin_panel_settings</mat-icon>
      Manage Section Locks
    </h2>
    <mat-dialog-content>
      @if (lockEntries().length === 0) {
        <p class="empty">No sections are currently checked out.</p>
      } @else {
        <mat-list>
          @for (entry of lockEntries(); track entry.section) {
            <mat-list-item>
              <mat-icon matListItemIcon>lock</mat-icon>
              <span matListItemTitle>{{ entry.label }}</span>
              <span matListItemLine>Locked by {{ entry.lock.lockedByName }}</span>
              <button
                mat-icon-button
                matListItemMeta
                (click)="unlockSection(entry.section)"
                aria-label="Force unlock section"
              >
                <mat-icon>lock_open</mat-icon>
              </button>
            </mat-list-item>
          }
        </mat-list>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      @if (lockEntries().length > 0) {
        <button mat-button color="warn" (click)="unlockAll()">
          <mat-icon>lock_open</mat-icon> Unlock All
        </button>
      }
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: `
    h2 { display: flex; align-items: center; gap: 8px; }
    .empty { color: #666; text-align: center; padding: 16px; }
  `,
})
export class ManageLocksDialogComponent implements OnInit, OnDestroy {
  protected readonly data = inject<ManageLocksDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ManageLocksDialogComponent>);
  private readonly submissionService = inject(SubmissionService);

  protected readonly lockEntries = signal<{ section: string; label: string; lock: SectionLock }[]>([]);
  private unsubSnapshot?: () => void;

  ngOnInit(): void {
    this.unsubSnapshot = this.submissionService.listenToSubmission(this.data.submissionId, (sub) => {
      const locks = sub.sectionLocks ?? {};
      this.lockEntries.set(
        Object.entries(locks).map(([section, lock]) => ({
          section,
          label: SECTION_LABELS[section] ?? section,
          lock,
        }))
      );
    });
  }

  ngOnDestroy(): void {
    this.unsubSnapshot?.();
  }

  protected async unlockSection(section: string): Promise<void> {
    await this.submissionService.forceUnlockSection(this.data.submissionId, section);
  }

  protected async unlockAll(): Promise<void> {
    await this.submissionService.forceUnlockAll(this.data.submissionId);
  }
}
