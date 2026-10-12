import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { SeasonService } from '../../core/services/season.service';

/** Shows the newest season. `undefined` while loading, `null` if no season exists yet. */
@Component({
  selector: 'app-active-season-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatChipsModule],
  template: `
    @if (season(); as seasonId) {
      <mat-chip-set aria-label="Active season">
        <mat-chip>Active season: {{ seasonId }}</mat-chip>
      </mat-chip-set>
    } @else if (season() === null) {
      <mat-chip-set aria-label="Active season">
        <mat-chip>No season yet</mat-chip>
      </mat-chip-set>
    }
  `,
})
export class ActiveSeasonChipComponent {
  private readonly seasonService = inject(SeasonService);

  readonly season = signal<string | null | undefined>(undefined);

  constructor() {
    this.seasonService
      .getCurrentSeasonId()
      .then((id) => this.season.set(id))
      .catch(() => this.season.set(null));
  }
}
