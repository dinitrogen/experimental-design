import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { ResourceService } from '../../core/services/resource.service';

@Component({
  selector: 'app-practice-event-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatSlideToggleModule, MatTooltipModule],
  template: `
    <div class="content-container">
      <h1 class="page-title">Practice Events</h1>
      <p class="subtitle">
        Simulated experimental design events. Read the prompt, plan your experiment,
        and practice writing a full competition report.
      </p>

      @if (loaded()) {
      <div class="card-grid">
        @for (event of practiceEvents(); track event.id) {
          <mat-card [class.hidden-guide]="isCoach() && isHidden(event.id)">
            <mat-card-header>
              <mat-icon mat-card-avatar>science</mat-icon>
              <mat-card-title>{{ event.title }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p>{{ event.summary }}</p>
            </mat-card-content>
            <mat-card-actions>
              <a mat-button [routerLink]="['/practice-events', event.slug]">
                View Event
              </a>
              @if (isCoach()) {
                <mat-slide-toggle
                  [checked]="!isHidden(event.id)"
                  (change)="toggleVisibility(event.id)"
                  matTooltip="Toggle student visibility"
                  aria-label="Toggle student visibility"
                  class="visibility-toggle"
                >
                  Visible
                </mat-slide-toggle>
              }
            </mat-card-actions>
          </mat-card>
        }
      </div>
      }
    </div>
  `,
  styles: `
    .subtitle {
      color: #666;
      margin-bottom: 24px;
      line-height: 1.5;
    }

    .visibility-toggle {
      margin-left: auto;
      font-size: 13px;
    }

    mat-card-actions {
      display: flex;
      align-items: center;
    }

    .hidden-guide {
      opacity: 0.5;
    }
  `,
})
export class PracticeEventListComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly resourceService = inject(ResourceService);

  protected readonly isCoach = this.authService.isCoach;
  protected readonly loaded = this.resourceService.hiddenGuidesLoaded;

  protected readonly practiceEvents = computed(() => {
    const all = this.resourceService.getGuidesByCategory('practice-events');
    if (this.isCoach()) {
      return all;
    }
    const hidden = this.resourceService.hiddenGuideIds();
    return all.filter((g) => !g.coachOnly && !hidden.has(g.id));
  });

  async ngOnInit(): Promise<void> {
    await this.resourceService.loadHiddenGuides();
  }

  protected isHidden(guideId: string): boolean {
    return this.resourceService.hiddenGuideIds().has(guideId);
  }

  protected async toggleVisibility(guideId: string): Promise<void> {
    await this.resourceService.toggleGuideVisibility(guideId);
  }
}
