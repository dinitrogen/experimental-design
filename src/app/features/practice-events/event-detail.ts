import { ChangeDetectionStrategy, Component, inject, input, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ResourceService } from '../../core/services/resource.service';
import { SubmissionService } from '../../core/services/submission.service';
import { AuthService } from '../../core/services/auth.service';
import { Resource } from '../../core/models/resource.model';
import { ReportSubmission } from '../../core/models/submission.model';
import { AssignTeamDialogComponent, AssignTeamDialogResult } from '../../shared/components/assign-team-dialog';
import { ManageLocksDialogComponent } from '../../shared/components/manage-locks-dialog';

@Component({
  selector: 'app-event-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="content-container">
      <a mat-button routerLink="/practice-events" class="back-link">
        <mat-icon>arrow_back</mat-icon>
        Back to Practice Events
      </a>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (event()) {
        <h1 class="page-title">{{ event()!.title }}</h1>
        <p class="event-summary">{{ event()!.summary }}</p>

        <mat-card class="info-card">
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <mat-icon>timer</mat-icon>
                <div>
                  <strong>Time Limit</strong>
                  <p>50 minutes</p>
                </div>
              </div>
              <div class="info-item">
                <mat-icon>description</mat-icon>
                <div>
                  <strong>Format</strong>
                  <p>Read the prompt, then complete a step-by-step report</p>
                </div>
              </div>
              <div class="info-item">
                <mat-icon>checklist</mat-icon>
                <div>
                  <strong>Sections</strong>
                  <p>Prompt, Variables, Procedure, Data, Statistics, CER, and more</p>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <div class="start-section">
          <mat-card class="start-card">
            <mat-card-content>
              <mat-icon class="start-icon">play_circle</mat-icon>
              <h2>Ready to begin?</h2>
              <p>
                When you click "Begin Event", the timer will start and you'll see
                the event prompt. Work through each section of the report within
                the time limit.
              </p>
              @if (hasDraft()) {
                <div class="draft-actions">
                  <button
                    mat-flat-button
                    class="start-button"
                    (click)="startReport()"
                  >
                    <mat-icon>edit</mat-icon>
                    Continue Report
                  </button>
                  <button
                    mat-stroked-button
                    class="new-report-button"
                    (click)="startNewReport()"
                  >
                    <mat-icon>add</mat-icon>
                    Start New Report
                  </button>
                </div>
                <p class="draft-note">You have an in-progress draft for this event.</p>
              } @else if (teamDraft()) {
                <div class="draft-actions">
                  <button
                    mat-flat-button
                    class="start-button"
                    (click)="startReport()"
                  >
                    <mat-icon>group</mat-icon>
                    Continue Team Report
                  </button>
                </div>
                <p class="draft-note">Your team has an in-progress report for this event.</p>
              } @else {
                <button
                  mat-flat-button
                  class="start-button"
                  (click)="startReport()"
                >
                  <mat-icon>play_arrow</mat-icon>
                  Begin Event
                </button>
              }
            </mat-card-content>
          </mat-card>
        </div>

        @if (isCoach()) {
          <mat-card class="coach-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>admin_panel_settings</mat-icon>
              <mat-card-title>Coach: Team Management</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if (teamDrafts().length === 0) {
                <p>No team drafts exist for this event.</p>
                <button mat-flat-button (click)="assignTeam()">
                  <mat-icon>group_add</mat-icon>
                  Assign Team to Event
                </button>
              } @else {
                @for (draft of teamDrafts(); track draft.id) {
                  <div class="team-draft-row">
                    <span>Team draft — {{ (draft.teamMemberUids ?? []).length }} members</span>
                    <button mat-stroked-button (click)="manageLocks(draft.id!)">
                      <mat-icon>lock_open</mat-icon>
                      Manage Locks
                    </button>
                  </div>
                }
                <button mat-flat-button (click)="assignTeam()" class="assign-another">
                  <mat-icon>group_add</mat-icon>
                  Assign Another Team
                </button>
              }
            </mat-card-content>
          </mat-card>
        }
      } @else {
        <div class="not-found">
          <mat-icon>error_outline</mat-icon>
          <h2>Event not found</h2>
          <a mat-button routerLink="/practice-events">Return to Practice Events</a>
        </div>
      }
    </div>
  `,
  styles: `
    .back-link { margin-bottom: 16px; }
    .loading-container { display: flex; justify-content: center; padding: 48px; }

    .event-summary {
      color: #666;
      font-size: 16px;
      margin: -16px 0 24px;
    }

    .info-card { margin-bottom: 24px; }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 8px 0;
    }

    .info-item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .info-item mat-icon {
      color: #1565c0;
      font-size: 28px;
      width: 28px;
      height: 28px;
      margin-top: 2px;
    }

    .info-item p { margin: 4px 0 0; color: #666; font-size: 14px; }

    .start-section { text-align: center; padding: 16px 0; }

    .start-card {
      max-width: 480px;
      margin: 0 auto;
    }

    .start-card mat-card-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 24px;
      text-align: center;
    }

    .start-icon {
      font-size: 56px;
      width: 56px;
      height: 56px;
      color: #1565c0;
      margin-bottom: 8px;
    }

    .start-card h2 { margin: 0 0 8px; font-weight: 400; }
    .start-card p { color: #666; font-size: 14px; max-width: 360px; margin: 0 0 20px; }

    .start-button { height: 48px; font-size: 16px; padding: 0 32px; }

    .draft-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .new-report-button { height: 48px; font-size: 16px; padding: 0 24px; }
    .draft-note {
      color: #1565c0;
      font-size: 13px;
      margin: 12px 0 0;
      font-style: italic;
    }

    .not-found { text-align: center; padding: 48px 16px; color: #666; }
    .not-found mat-icon { font-size: 48px; width: 48px; height: 48px; color: #bbb; }

    .coach-card {
      margin-top: 24px;
    }

    .coach-card mat-card-content {
      padding-top: 8px;
    }

    .team-draft-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }

    .assign-another {
      margin-top: 12px;
    }
  `,
})
export class EventDetailComponent implements OnInit {
  readonly slug = input.required<string>();

  private readonly router = inject(Router);
  private readonly resourceService = inject(ResourceService);
  private readonly submissionService = inject(SubmissionService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isCoach = this.authService.isCoach;
  protected readonly loading = signal(true);
  protected readonly event = signal<Resource | null>(null);
  protected readonly hasDraft = signal(false);
  protected readonly teamDraft = signal<ReportSubmission | null>(null);
  protected readonly teamDrafts = signal<ReportSubmission[]>([]);

  async ngOnInit(): Promise<void> {
    const found = this.resourceService.getGuideBySlug(this.slug());
    this.event.set(found ?? null);
    if (found) {
      this.hasDraft.set(await this.submissionService.hasDraft(this.slug()));
      // Check for team draft (for students)
      const td = await this.submissionService.getTeamDraft(this.slug());
      this.teamDraft.set(td);
      // Coach: load all team drafts for this event
      if (this.isCoach()) {
        this.teamDrafts.set(await this.submissionService.getTeamDraftsForEvent(this.slug()));
      }
    }
    this.loading.set(false);
  }

  protected startReport(): void {
    const e = this.event();
    if (e) {
      this.router.navigate(['/practice-events', e.slug, 'report']);
    }
  }

  protected async startNewReport(): Promise<void> {
    const e = this.event();
    if (!e) return;
    // Get and reset the existing draft so it becomes blank
    const draft = await this.submissionService.getOrCreateDraft(e.slug);
    if (draft.id) {
      await this.submissionService.resetDraft(draft.id, e.slug);
    }
    this.router.navigate(['/practice-events', e.slug, 'report']);
  }

  // ── Coach actions ──────────────────────────────────────────────────

  protected assignTeam(): void {
    const e = this.event();
    if (!e) return;

    const dialogRef = this.dialog.open(AssignTeamDialogComponent, {
      width: '440px',
      data: { practiceEventId: e.slug, practiceEventTitle: e.title },
    });

    dialogRef.afterClosed().subscribe(async (result: AssignTeamDialogResult | undefined) => {
      if (!result) return;
      try {
        await this.submissionService.createTeamDraft(result.memberUids, e.slug);
        this.snackBar.open(`Team assigned with ${result.memberUids.length} members.`, 'OK', { duration: 3000 });
        // Refresh
        this.teamDrafts.set(await this.submissionService.getTeamDraftsForEvent(this.slug()));
      } catch {
        this.snackBar.open('Failed to assign team. Please try again.', 'OK', { duration: 5000 });
      }
    });
  }

  protected manageLocks(submissionId: string): void {
    this.dialog.open(ManageLocksDialogComponent, {
      width: '440px',
      data: { submissionId },
    });
  }
}
