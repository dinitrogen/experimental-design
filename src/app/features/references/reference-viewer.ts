import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ResourceService } from '../../core/services/resource.service';

@Component({
  selector: 'app-reference-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="content-container">
      @if (reference(); as ref) {
        <div class="viewer-header">
          <a mat-button routerLink="/references">
            <mat-icon>arrow_back</mat-icon>
            Back to References
          </a>
          <h1 class="page-title">{{ ref.title }}</h1>
          <a mat-stroked-button [href]="ref.fileName" target="_blank" rel="noopener">
            <mat-icon>open_in_new</mat-icon>
            Open in New Tab
          </a>
        </div>

        @if (loading()) {
          <div class="loading-container">
            <mat-spinner diameter="40" />
          </div>
        }

        <div class="pdf-container">
          <object
            [data]="pdfUrl()"
            type="application/pdf"
            class="pdf-viewer"
            [attr.aria-label]="ref.title"
            (load)="loading.set(false)"
          >
            <p>
              Your browser does not support embedded PDF viewing.
              <a [href]="ref.fileName" target="_blank" rel="noopener">Download the PDF</a> instead.
            </p>
          </object>
        </div>
      } @else {
        <div class="empty-state">
          <mat-icon>error_outline</mat-icon>
          <p>Reference not found.</p>
          <a mat-button routerLink="/references">Back to References</a>
        </div>
      }
    </div>
  `,
  styles: `
    .viewer-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .viewer-header .page-title {
      flex: 1;
      margin: 0;
      min-width: 200px;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .pdf-container {
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
    }

    .pdf-viewer {
      width: 100%;
      height: calc(100vh - 200px);
      min-height: 500px;
      display: block;
    }

    .empty-state {
      text-align: center;
      padding: 64px 16px;
      color: var(--text-secondary);
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
  `,
})
export class ReferenceViewerComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly resourceService = inject(ResourceService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly loading = signal(true);

  protected readonly reference = computed(() => {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) return undefined;
    const ref = this.resourceService.getGuideBySlug(slug);
    return ref?.category === 'references' ? ref : undefined;
  });

  protected readonly pdfUrl = computed(() => {
    const ref = this.reference();
    if (!ref) return '';
    return this.sanitizer.bypassSecurityTrustResourceUrl(ref.fileName);
  });
}
