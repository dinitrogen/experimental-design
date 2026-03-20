import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StudentService } from '../../core/services/student.service';
import { AchievementService } from '../../core/services/achievement.service';
import { TeamService } from '../../core/services/team.service';
import { AuthService } from '../../core/services/auth.service';
import { AppUser } from '../../core/models/user.model';
import { Achievement, ACHIEVEMENT_TEMPLATES, sortAchievements } from '../../core/models/achievement.model';
import { TeamEvent, RoleAssignments } from '../../core/models/team-event.model';
import { EventFormDialogComponent } from './event-form-dialog';
import { TeamRolesDialogComponent, TeamRolesDialogData } from './team-roles-dialog';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog';

interface RosterRow {
  user: AppUser;
  achievements: { templateId: string; title: string; icon: string; completed: boolean }[];
}

@Component({
  selector: 'app-team',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="content-container">
      <h1 class="page-title">Team</h1>

      <mat-tab-group>
        <!-- Roster Tab -->
        <mat-tab label="Roster">
          <div class="tab-content">
            @if (loading()) {
              <div class="loading-container">
                <mat-spinner diameter="48" />
              </div>
            } @else {
              <!-- Students Section -->
              <h2 class="section-title">
                <mat-icon class="section-icon">school</mat-icon>
                Students
              </h2>
              @if (studentRows().length === 0) {
                <mat-card>
                  <mat-card-content class="empty-state">
                    <p>No students on the team yet.</p>
                  </mat-card-content>
                </mat-card>
              } @else {
                <mat-card class="roster-card">
                  <table mat-table [dataSource]="studentRows()" class="roster-table">
                    <ng-container matColumnDef="displayName">
                      <th mat-header-cell *matHeaderCellDef>Name</th>
                      <td mat-cell *matCellDef="let row">{{ row.user.displayName }}</td>
                    </ng-container>

                    <ng-container matColumnDef="school">
                      <th mat-header-cell *matHeaderCellDef>School</th>
                      <td mat-cell *matCellDef="let row">
                        @if (row.user.middleSchool) {
                          <mat-chip-set>
                            <mat-chip>{{ row.user.middleSchool }}</mat-chip>
                          </mat-chip-set>
                        } @else {
                          <span class="muted">—</span>
                        }
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="grade">
                      <th mat-header-cell *matHeaderCellDef>Grade</th>
                      <td mat-cell *matCellDef="let row">
                        @if (row.user.grade) {
                          {{ row.user.grade }}
                        } @else {
                          <span class="muted">—</span>
                        }
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="achievements">
                      <th mat-header-cell *matHeaderCellDef>Achievements</th>
                      <td mat-cell *matCellDef="let row">
                        <div class="achievement-icons">
                          @for (ach of row.achievements; track ach.templateId) {
                            <mat-icon
                              class="trophy-icon"
                              [class.trophy-achieved]="ach.completed"
                              [class.trophy-locked]="!ach.completed"
                              [matTooltip]="ach.title + (ach.completed ? ' ✓' : ' (not yet)')"
                            >emoji_events</mat-icon>
                          }
                        </div>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="rosterColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: rosterColumns"></tr>
                  </table>
                </mat-card>
              }

              <!-- Coaches Section -->
              <h2 class="section-title coaches-title">
                <mat-icon class="section-icon">supervised_user_circle</mat-icon>
                Coaches
              </h2>
              @if (coaches().length === 0) {
                <mat-card>
                  <mat-card-content class="empty-state">
                    <p>No coaches found.</p>
                  </mat-card-content>
                </mat-card>
              } @else {
                <mat-card class="roster-card">
                  <table mat-table [dataSource]="coaches()" class="roster-table coach-table">
                    <ng-container matColumnDef="displayName">
                      <th mat-header-cell *matHeaderCellDef>Name</th>
                      <td mat-cell *matCellDef="let coach">{{ coach.displayName }}</td>
                    </ng-container>

                    <ng-container matColumnDef="email">
                      <th mat-header-cell *matHeaderCellDef>Email</th>
                      <td mat-cell *matCellDef="let coach">{{ coach.email }}</td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="coachColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: coachColumns"></tr>
                  </table>
                </mat-card>
              }
            }
          </div>
        </mat-tab>

        <!-- Events Tab -->
        <mat-tab label="Events">
          <div class="tab-content">
            @if (isCoach()) {
              <div class="events-header">
                <button mat-raised-button color="primary" (click)="openAddEventDialog()">
                  <mat-icon>add</mat-icon>
                  Add New Event
                </button>
              </div>
            }

            @if (loading()) {
              <div class="loading-container">
                <mat-spinner diameter="48" />
              </div>
            } @else if (teamEvents().length === 0) {
              <mat-card>
                <mat-card-content class="empty-state">
                  <mat-icon>groups</mat-icon>
                  <h2>No Events Yet</h2>
                  <p>
                    @if (isCoach()) {
                      Click "Add New Event" to create your first event and assign teams.
                    } @else {
                      Event team assignments will appear here once a coach sets them up.
                    }
                  </p>
                </mat-card-content>
              </mat-card>
            } @else {
              @for (event of teamEvents(); track event.id) {
                <mat-card class="event-card">
                  <mat-card-header>
                    <mat-icon mat-card-avatar class="event-icon">event</mat-icon>
                    <mat-card-title>{{ event.title }}</mat-card-title>
                    <mat-card-subtitle>
                      @if (event.location) {
                        {{ event.location }}
                      }
                      @if (event.location && event.eventDate) {
                        —
                      }
                      @if (event.eventDate) {
                        {{ formatDate(event.eventDate) }}
                      }
                    </mat-card-subtitle>
                  </mat-card-header>

                  <mat-card-content>
                    @for (team of event.teams; track $index; let tIdx = $index) {
                      <div class="team-block">
                        <div class="team-block-header">
                          <h3>
                            {{ team.teamName || team.schoolName }}
                            @if (team.teamName) {
                              <span class="school-label">({{ team.schoolName }})</span>
                            }
                          </h3>
                          <button
                            mat-stroked-button
                            (click)="openRolesDialog(event, tIdx)"
                            matTooltip="View or edit team role assignments"
                          >
                            <mat-icon>assignment</mat-icon>
                            Team Roles
                          </button>
                        </div>
                        <div class="team-members">
                          @for (uid of team.memberUids; track uid) {
                            <div class="team-member">
                              <mat-icon>person</mat-icon>
                              <span class="member-name">{{ getMemberName(uid) }}</span>
                            </div>
                          }
                        </div>
                      </div>
                      @if (!$last) {
                        <mat-divider />
                      }
                    }

                    @if (event.alternateUids?.length) {
                      <mat-divider />
                      <div class="alternates-block">
                        <h4>Alternates</h4>
                        <div class="team-members">
                          @for (uid of event.alternateUids; track uid) {
                            <div class="team-member">
                              <mat-icon>person_outline</mat-icon>
                              <span class="member-name">{{ getMemberName(uid) }}</span>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </mat-card-content>

                  @if (isCoach()) {
                    <mat-card-actions>
                      <button mat-button (click)="openEditEventDialog(event)">
                        <mat-icon>edit</mat-icon>
                        Edit
                      </button>
                      <button mat-button color="warn" (click)="deleteEvent(event)">
                        <mat-icon>delete</mat-icon>
                        Delete
                      </button>
                    </mat-card-actions>
                  }
                </mat-card>
              }
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: `
    .tab-content {
      padding-top: 24px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px;
      font-size: 20px;
    }

    .coaches-title {
      margin-top: 32px;
    }

    .section-icon {
      color: var(--primary-color);
    }

    .roster-card {
      overflow: auto;
    }

    .roster-table {
      width: 100%;
    }

    .muted {
      color: #999;
    }

    .achievement-icons {
      display: flex;
      gap: 2px;
      flex-wrap: wrap;
    }

    .trophy-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      cursor: default;
    }

    .trophy-achieved {
      color: #ffc107;
    }

    .trophy-locked {
      color: #ccc;
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

    .events-header {
      margin-bottom: 16px;
    }

    .event-card {
      margin-bottom: 16px;
    }

    .event-icon {
      background: color-mix(in srgb, var(--primary-color) 12%, transparent);
      color: var(--primary-color);
      border-radius: 50%;
      padding: 8px;
      font-size: 24px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .team-block {
      padding: 16px 0;
    }

    .team-block-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 8px;
    }

    .team-block-header h3 {
      margin: 0;
      font-size: 16px;
    }

    .school-label {
      color: #888;
      font-weight: 400;
      font-size: 14px;
    }

    .team-members {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .team-member {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .team-member mat-icon {
      color: #666;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .member-name {
      font-weight: 500;
    }

    .alternates-block {
      padding: 16px 0 0;
    }

    .alternates-block h4 {
      margin: 0 0 8px;
      color: #888;
      font-size: 14px;
    }

    .coach-table {
      width: 100%;
    }
  `,
})
export class TeamComponent implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly achievementService = inject(AchievementService);
  private readonly teamService = inject(TeamService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly loading = signal(true);
  protected readonly studentRows = signal<RosterRow[]>([]);
  protected readonly coaches = signal<AppUser[]>([]);
  protected readonly teamEvents = signal<TeamEvent[]>([]);
  protected readonly isCoach = this.authService.isCoach;

  private memberMap = new Map<string, AppUser>();

  protected readonly rosterColumns = ['displayName', 'school', 'grade', 'achievements'];
  protected readonly coachColumns = ['displayName', 'email'];

  async ngOnInit(): Promise<void> {
    try {
      const [students, coachList, events, allAchievements] = await Promise.all([
        this.studentService.getAllStudents(),
        this.studentService.getAllCoaches(),
        this.teamService.getTeamEvents(),
        this.achievementService.getAllAchievements(),
      ]);

      // Build member map for event member lookup
      for (const s of students) {
        this.memberMap.set(s.uid, s);
      }
      for (const c of coachList) {
        this.memberMap.set(c.uid, c);
      }

      // Filter out students excluded from roster
      const rosterStudents = students.filter((s) => !s.excludeFromRoster);

      // Group achievements by student
      const achievementsByUid = new Map<string, Achievement[]>();
      for (const a of allAchievements) {
        const list = achievementsByUid.get(a.studentUid) ?? [];
        list.push(a);
        achievementsByUid.set(a.studentUid, list);
      }

      // Build roster rows
      const rows: RosterRow[] = [];
      for (const student of rosterStudents) {
        const rawAchievements = achievementsByUid.get(student.uid) ?? [];

        const achievements = sortAchievements(rawAchievements).map((a) => {
          const tmpl = ACHIEVEMENT_TEMPLATES.find((t) => t.id === a.templateId);
          return {
            templateId: a.templateId,
            title: tmpl?.title ?? a.templateId,
            icon: tmpl?.icon ?? 'emoji_events',
            completed: a.completed,
          };
        });

        rows.push({
          user: student,
          achievements,
        });
      }

      this.studentRows.set(rows);
      this.coaches.set(coachList);
      this.teamEvents.set(events);
    } finally {
      this.loading.set(false);
    }
  }

  protected getMemberName(uid: string): string {
    return this.memberMap.get(uid)?.displayName ?? uid;
  }

  protected formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  protected openAddEventDialog(): void {
    const dialogRef = this.dialog.open(EventFormDialogComponent, {
      width: '600px',
      disableClose: true,
      data: null,
    });

    dialogRef.afterClosed().subscribe((result: TeamEvent | undefined) => {
      if (result) {
        this.teamEvents.update((list) => [...list, result]);
        this.snackBar.open(`Event "${result.title}" created!`, 'OK', { duration: 3000 });
      }
    });
  }

  protected openEditEventDialog(event: TeamEvent): void {
    const dialogRef = this.dialog.open(EventFormDialogComponent, {
      width: '600px',
      disableClose: true,
      data: event,
    });

    dialogRef.afterClosed().subscribe((result: TeamEvent | undefined) => {
      if (result) {
        this.teamEvents.update((list) =>
          list.map((e) => (e.id === result.id ? result : e)),
        );
        this.snackBar.open(`Event "${result.title}" updated.`, 'OK', { duration: 3000 });
      }
    });
  }

  protected deleteEvent(event: TeamEvent): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Event',
        message: `Delete "${event.title}" and all its team assignments?`,
        confirmText: 'Delete',
        confirmColor: 'warn',
        icon: 'warning',
      },
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed || !event.id) return;
      await this.teamService.removeTeamEvent(event.id);
      this.teamEvents.update((list) => list.filter((e) => e.id !== event.id));
      this.snackBar.open(`Deleted "${event.title}".`, 'OK', { duration: 3000 });
    });
  }

  protected openRolesDialog(event: TeamEvent, teamIndex: number): void {
    const team = event.teams[teamIndex];
    const currentUid = this.authService.user()?.uid ?? '';
    const canEdit = this.isCoach() || team.memberUids.includes(currentUid);

    const data: TeamRolesDialogData = {
      eventId: event.id!,
      teamIndex,
      teamLabel: team.teamName || team.schoolName,
      memberUids: team.memberUids,
      memberMap: this.memberMap,
      roleAssignments: team.roleAssignments ?? {},
      canEdit,
    };

    const dialogRef = this.dialog.open(TeamRolesDialogComponent, {
      width: '700px',
      data,
    });

    dialogRef.afterClosed().subscribe((result: RoleAssignments | undefined) => {
      if (result) {
        // Update local state
        this.teamEvents.update((list) =>
          list.map((e) => {
            if (e.id !== event.id) return e;
            const teams = e.teams.map((t, i) =>
              i === teamIndex ? { ...t, roleAssignments: result } : t,
            );
            return { ...e, teams };
          }),
        );
      }
    });
  }
}
