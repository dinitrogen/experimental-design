import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ResourceService } from '../../core/services/resource.service';

@Component({
  selector: 'app-reference-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="content-container">
      <h1 class="page-title">References</h1>
      <p class="page-subtitle">Official forms and scoring documents for competition day.</p>

      <div class="card-grid">
        @for (ref of references(); track ref.id) {
          <mat-card>
            <mat-card-header>
              <mat-icon mat-card-avatar>description</mat-icon>
              <mat-card-title>{{ ref.title }}</mat-card-title>
              <mat-card-subtitle>PDF Document</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>{{ ref.summary }}</p>
            </mat-card-content>
            <mat-card-actions>
              <a mat-button [routerLink]="['/references', ref.slug]">
                <mat-icon>visibility</mat-icon>
                View
              </a>
              <a mat-button [href]="ref.fileName" target="_blank" rel="noopener">
                <mat-icon>open_in_new</mat-icon>
                Open in New Tab
              </a>
            </mat-card-actions>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: `
    .page-subtitle {
      color: var(--text-secondary);
      margin-bottom: 24px;
    }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 16px;
    }

    mat-card-actions a {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
  `,
})
export class ReferenceListComponent {
  private readonly resourceService = inject(ResourceService);

  protected readonly references = computed(() =>
    this.resourceService
      .getGuidesByCategory('references')
      .sort((a, b) => a.order - b.order)
  );
}
