import { ChangeDetectionStrategy, Component, inject, input, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MarkdownComponent } from 'ngx-markdown';
import { ResourceService } from '../../core/services/resource.service';
import { ProgressService } from '../../core/services/progress.service';
import { PdfService } from '../../core/services/pdf.service';
import { Resource } from '../../core/models/resource.model';

@Component({
  selector: 'app-study-guide-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MarkdownComponent,
  ],
  template: `
    <div class="content-container">
      <a mat-button routerLink="/study-guides" class="back-link">
        <mat-icon>arrow_back</mat-icon>
        Back to Study Guides
      </a>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (guide()) {
        <h1 class="page-title">{{ guide()!.title }}</h1>

        <div class="guide-toolbar">
          <button mat-stroked-button (click)="downloadPdf()" [disabled]="downloading()">
            <mat-icon>download</mat-icon>
            {{ downloading() ? 'Generating...' : 'Download PDF' }}
          </button>
        </div>

        <div class="markdown-body">
          <markdown [data]="markdownContent()" katex></markdown>
        </div>

        @if (!completed()) {
          <div class="actions">
            <button mat-flat-button (click)="markAsCompleted()">
              <mat-icon>check</mat-icon>
              Mark as Completed
            </button>
          </div>
        } @else {
          <div class="completed-banner">
            <mat-icon>check_circle</mat-icon>
            You've completed this guide!
          </div>
        }
      } @else {
        <div class="not-found">
          <mat-icon>error_outline</mat-icon>
          <h2>Guide not found</h2>
          <a mat-button routerLink="/study-guides">Return to Study Guides</a>
        </div>
      }
    </div>
  `,
  styles: `
    .back-link {
      margin-bottom: 16px;
    }

    .guide-toolbar {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .actions {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
    }

    .completed-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 32px;
      padding: 16px;
      background: #e8f5e9;
      border-radius: 8px;
      color: #2e7d32;
      font-weight: 500;
    }

    .not-found {
      text-align: center;
      padding: 48px 16px;
      color: #666;
    }

    .not-found mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #bbb;
    }
  `,
})
export class StudyGuideDetailComponent implements OnInit {
  readonly slug = input.required<string>();

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly resourceService = inject(ResourceService);
  private readonly progressService = inject(ProgressService);
  private readonly pdfService = inject(PdfService);

  protected readonly loading = signal(true);
  protected readonly guide = signal<Resource | null>(null);
  protected readonly markdownContent = signal('');
  protected readonly completed = signal(false);
  protected readonly downloading = signal(false);

  async ngOnInit(): Promise<void> {
    const found = this.resourceService.getGuideBySlug(this.slug());
    if (!found) {
      this.loading.set(false);
      return;
    }

    this.guide.set(found);

    // Load markdown content from public/guides/
    this.http.get(`guides/${found.fileName}`, { responseType: 'text' }).subscribe({
      next: (content) => {
        this.markdownContent.set(content);
        this.loading.set(false);
      },
      error: () => {
        this.markdownContent.set('*Guide content could not be loaded.*');
        this.loading.set(false);
      },
    });

    // Check progress
    const progress = await this.progressService.getProgress(found.id);
    if (progress?.status === 'completed') {
      this.completed.set(true);
    }
  }

  protected async markAsCompleted(): Promise<void> {
    const g = this.guide();
    if (!g) return;
    await this.progressService.markCompleted(g.id);
    this.completed.set(true);
  }

  protected async downloadPdf(): Promise<void> {
    const g = this.guide();
    if (!g || this.downloading()) return;
    this.downloading.set(true);
    try {
      // Use the rendered markdown from the DOM
      const el = document.querySelector('.markdown-body');
      if (el) {
        await this.pdfService.generateFromElement(el as HTMLElement, g.slug);
      }
    } finally {
      this.downloading.set(false);
    }
  }
}
