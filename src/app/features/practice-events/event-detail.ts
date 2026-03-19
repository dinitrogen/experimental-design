import { ChangeDetectionStrategy, Component, inject, input, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ResourceService } from '../../core/services/resource.service';
import { SubmissionService } from '../../core/services/submission.service';
import { Resource } from '../../core/models/resource.model';

@Component({
  selector: 'app-event-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
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
  `,
})
export class EventDetailComponent implements OnInit {
  readonly slug = input.required<string>();

  private readonly router = inject(Router);
  private readonly resourceService = inject(ResourceService);
  private readonly submissionService = inject(SubmissionService);

  protected readonly loading = signal(true);
  protected readonly event = signal<Resource | null>(null);
  protected readonly hasDraft = signal(false);

  async ngOnInit(): Promise<void> {
    const found = this.resourceService.getGuideBySlug(this.slug());
    this.event.set(found ?? null);
    if (found) {
      this.hasDraft.set(await this.submissionService.hasDraft(this.slug()));
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
}
