import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { SeasonService } from '../../core/services/season.service';
import { TeamService } from '../../core/services/team.service';
import { ArchivedTeamEvent, ROLE_SECTIONS } from '../../core/models/team-event.model';

interface PastSeason {
  seasonId: string;
  events: ArchivedTeamEvent[];
}

interface RoleRow {
  section: string;
  name: string;
}

@Component({
  selector: 'app-past-events',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule, MatDividerModule],
  template: `
    @if (loading()) {
      <div class="loading-container">
        <mat-spinner diameter="48" />
      </div>
    } @else if (error()) {
      <mat-card>
        <mat-card-content class="empty-state">
          <p>{{ error() }}</p>
        </mat-card-content>
      </mat-card>
    } @else if (seasons().length === 0) {
      <mat-card>
        <mat-card-content class="empty-state">
          <mat-icon>history</mat-icon>
          <h2>No Past Events Yet</h2>
          <p>Events from completed seasons will appear here, read-only.</p>
        </mat-card-content>
      </mat-card>
    } @else {
      @for (season of seasons(); track season.seasonId) {
        <h2 class="season-title">Season {{ season.seasonId }}</h2>

        @if (season.events.length === 0) {
          <p class="muted">No events were recorded for this season.</p>
        }

        @for (event of season.events; track event.id) {
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
                  <h3>
                    {{ team.teamName || team.schoolName }}
                    @if (team.teamName) {
                      <span class="school-label">({{ team.schoolName }})</span>
                    }
                  </h3>
                  <div class="team-members">
                    @for (uid of team.memberUids; track uid) {
                      <div class="team-member">
                        <mat-icon>person</mat-icon>
                        <span class="member-name">{{ nameFor(event, uid) }}</span>
                      </div>
                    }
                  </div>

                  @if (roleRows(team.roleAssignments, event).length > 0) {
                    <h4 class="roles-heading">Report roles</h4>
                    <dl class="roles">
                      @for (row of roleRows(team.roleAssignments, event); track row.section) {
                        <dt>{{ row.section }}</dt>
                        <dd>{{ row.name }}</dd>
                      }
                    </dl>
                  }
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
                        <span class="member-name">{{ nameFor(event, uid) }}</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </mat-card-content>
          </mat-card>
        }
      }
    }
  `,
  styles: `
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .season-title {
      margin: 24px 0 12px;
      font-size: 20px;
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

    .team-block,
    .alternates-block {
      padding: 16px 0;
    }

    .team-block h3,
    .alternates-block h4 {
      margin: 0 0 8px;
      font-size: 16px;
    }

    .alternates-block h4 {
      color: #888;
      font-size: 14px;
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

    .roles-heading {
      margin: 16px 0 8px;
      color: #888;
      font-size: 14px;
    }

    .roles {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 4px 16px;
      margin: 0;
    }

    .roles dt {
      color: #555;
    }

    .roles dd {
      margin: 0;
      font-weight: 500;
    }

    .muted {
      color: #888;
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
  `,
})
export class PastEventsComponent implements OnInit {
  private readonly seasonService = inject(SeasonService);
  private readonly teamService = inject(TeamService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly seasons = signal<PastSeason[]>([]);

  async ngOnInit(): Promise<void> {
    try {
      // Only completed rollovers are shown; an in-progress season's archive is partial.
      const completed = (await this.seasonService.getSeasons()).filter(
        (s) => s.status === 'complete',
      );
      const groups = await Promise.all(
        completed.map(async (s) => ({
          seasonId: s.id,
          events: await this.teamService.getArchivedEvents(s.id),
        })),
      );
      this.seasons.set(groups);
    } catch {
      this.error.set('Past events could not be loaded. Try refreshing the page.');
    } finally {
      this.loading.set(false);
    }
  }

  protected nameFor(event: ArchivedTeamEvent, uid: string): string {
    return event.memberNames?.[uid] || 'Former member';
  }

  /** Assigned report sections for one team, in the standard planner order. */
  protected roleRows(
    assignments: Record<string, string> | undefined,
    event: ArchivedTeamEvent,
  ): RoleRow[] {
    if (!assignments) return [];
    return ROLE_SECTIONS.filter((r) => assignments[r.section]).map((r) => ({
      section: r.section,
      name: this.nameFor(event, assignments[r.section]),
    }));
  }

  protected formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
