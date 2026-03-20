import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TeamService } from '../../core/services/team.service';
import { ROLE_SECTIONS, RoleAssignments, RoleSection } from '../../core/models/team-event.model';
import { AppUser } from '../../core/models/user.model';

export interface TeamRolesDialogData {
  eventId: string;
  teamIndex: number;
  teamLabel: string;
  memberUids: string[];
  memberMap: Map<string, AppUser>;
  roleAssignments: RoleAssignments;
  canEdit: boolean;
}

interface RoleRow {
  section: string;
  points: number;
  assignedUid: string;
}

@Component({
  selector: 'app-team-roles-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTableModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Team Roles — {{ data.teamLabel }}</h2>

    <mat-dialog-content>
      @if (!data.canEdit) {
        <p class="view-only-notice">
          <mat-icon>visibility</mat-icon>
          View only — only team members and coaches can edit.
        </p>
      }

      <!-- Recommended roles summary -->
      <div class="recommended-roles">
        <h3>Recommended Role Split</h3>
        <div class="role-cards">
          <div class="role-card designer">
            <strong>Designer (40 pts)</strong>
            <span>Problem Statement, Hypothesis, Variables, Materials, Procedure & Diagrams</span>
          </div>
          <div class="role-card data-lead">
            <strong>Data Lead (34 pts)</strong>
            <span>Data Table, Graph, Statistics, Experimental Error</span>
          </div>
          <div class="role-card analyst">
            <strong>Analyst (44 pts)</strong>
            <span>Observations, CER, Conclusion, Applications & Recommendations</span>
          </div>
        </div>
      </div>

      <!-- Assignment table -->
      <table mat-table [dataSource]="rows()" class="roles-table">
        <ng-container matColumnDef="section">
          <th mat-header-cell *matHeaderCellDef>Section (pts)</th>
          <td mat-cell *matCellDef="let row">
            {{ row.section }}
            @if (row.points > 0) {
              <span class="points">({{ row.points }})</span>
            }
          </td>
        </ng-container>

        @for (uid of data.memberUids; track uid; let mIdx = $index) {
          <ng-container [matColumnDef]="'member_' + mIdx">
            <th mat-header-cell *matHeaderCellDef>{{ getMemberName(uid) }}</th>
            <td mat-cell *matCellDef="let row">
              @if (data.canEdit) {
                <button
                  mat-icon-button
                  [class.assigned]="row.assignedUid === uid"
                  (click)="toggleAssignment(row, uid)"
                  [matTooltip]="row.assignedUid === uid ? 'Remove assignment' : 'Assign'"
                  [attr.aria-label]="'Assign ' + getMemberName(uid) + ' to ' + row.section"
                >
                  <mat-icon>{{ row.assignedUid === uid ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                </button>
              } @else {
                @if (row.assignedUid === uid) {
                  <mat-icon class="assigned-icon">check_circle</mat-icon>
                }
              }
            </td>
          </ng-container>
        }

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
      </table>

      <!-- Points summary -->
      <div class="points-summary">
        <h3>Points per Member</h3>
        <div class="summary-chips">
          @for (uid of data.memberUids; track uid) {
            <mat-chip-set>
              <mat-chip>
                {{ getMemberName(uid) }}: {{ getMemberPoints(uid) }} pts
              </mat-chip>
            </mat-chip-set>
          }
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      @if (data.canEdit) {
        <button mat-button mat-dialog-close [disabled]="saving()">Cancel</button>
        <button
          mat-raised-button
          color="primary"
          (click)="save()"
          [disabled]="saving()"
        >
          @if (saving()) {
            <mat-spinner diameter="20" />
          } @else {
            Save
          }
        </button>
      } @else {
        <button mat-raised-button mat-dialog-close>Close</button>
      }
    </mat-dialog-actions>
  `,
  styles: `
    mat-dialog-content {
      min-width: 500px;
      max-height: 70vh;
    }

    .view-only-notice {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #fff3e0;
      border-radius: 8px;
      color: #e65100;
      font-size: 14px;
      margin-bottom: 16px;
    }

    .recommended-roles {
      margin-bottom: 16px;
    }

    .recommended-roles h3 {
      font-size: 14px;
      color: #666;
      margin: 0 0 8px;
    }

    .role-cards {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .role-card {
      flex: 1;
      min-width: 140px;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .role-card.designer {
      background: color-mix(in srgb, var(--primary-color) 12%, transparent);
      border-left: 3px solid var(--primary-color);
    }

    .role-card.data-lead {
      background: #e8f5e9;
      border-left: 3px solid #2e7d32;
    }

    .role-card.analyst {
      background: #fce4ec;
      border-left: 3px solid #c62828;
    }

    .roles-table {
      width: 100%;
      margin-top: 16px;
    }

    .points {
      color: #999;
      font-size: 12px;
    }

    .assigned mat-icon,
    .assigned-icon {
      color: #4caf50;
    }

    .points-summary {
      margin-top: 16px;
    }

    .points-summary h3 {
      font-size: 14px;
      color: #666;
      margin: 0 0 8px;
    }

    .summary-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
  `,
})
export class TeamRolesDialogComponent implements OnInit {
  protected readonly data: TeamRolesDialogData = inject(MAT_DIALOG_DATA);
  private readonly teamService = inject(TeamService);
  private readonly dialogRef = inject(MatDialogRef<TeamRolesDialogComponent>);

  protected readonly rows = signal<RoleRow[]>([]);
  protected readonly saving = signal(false);
  protected readonly displayedColumns: string[] = [];

  ngOnInit(): void {
    // Build columns
    this.displayedColumns.push('section');
    for (let i = 0; i < this.data.memberUids.length; i++) {
      this.displayedColumns.push('member_' + i);
    }

    // Build rows from sections
    const r: RoleRow[] = ROLE_SECTIONS.map((s) => ({
      section: s.section,
      points: s.points,
      assignedUid: this.data.roleAssignments[s.section] ?? '',
    }));
    this.rows.set(r);
  }

  protected getMemberName(uid: string): string {
    return this.data.memberMap.get(uid)?.displayName ?? uid;
  }

  protected toggleAssignment(row: RoleRow, uid: string): void {
    this.rows.update((rows) =>
      rows.map((r) =>
        r.section === row.section
          ? { ...r, assignedUid: r.assignedUid === uid ? '' : uid }
          : r,
      ),
    );
  }

  protected getMemberPoints(uid: string): number {
    return this.rows().reduce(
      (sum, r) => sum + (r.assignedUid === uid ? r.points : 0),
      0,
    );
  }

  protected async save(): Promise<void> {
    this.saving.set(true);
    try {
      const assignments: RoleAssignments = {};
      for (const r of this.rows()) {
        if (r.assignedUid) {
          assignments[r.section] = r.assignedUid;
        }
      }
      await this.teamService.updateRoleAssignments(
        this.data.eventId,
        this.data.teamIndex,
        assignments,
      );
      this.dialogRef.close(assignments);
    } finally {
      this.saving.set(false);
    }
  }
}
