import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MarkdownComponent } from 'ngx-markdown';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AuthService } from '../../core/services/auth.service';
import { ResourceService, CategoryInfo } from '../../core/services/resource.service';
import { ProgressService } from '../../core/services/progress.service';
import { PdfService } from '../../core/services/pdf.service';
import { Resource, ResourceCategory, ReadingProgress } from '../../core/models/resource.model';

@Component({
  selector: 'app-study-guide-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    MarkdownComponent,
  ],
  template: `
    <div class="content-container">
      <h1 class="page-title">Study Guides</h1>

      <div class="category-chips" role="radiogroup" aria-label="Filter by category">
        <button
          mat-stroked-button
          [class.active]="!selectedCategory()"
          (click)="selectCategory(null)"
        >
          All
        </button>
        @for (cat of categories(); track cat.id) {
          <button
            mat-stroked-button
            [class.active]="selectedCategory() === cat.id"
            (click)="selectCategory(cat.id)"
          >
            <mat-icon>{{ cat.icon }}</mat-icon>
            {{ cat.label }}
          </button>
        }
      </div>

      @if (loaded()) {
      <div class="card-grid">
        @for (guide of filteredGuides(); track guide.id) {
          <mat-card [class.hidden-guide]="isCoach() && isHidden(guide.id)">
            <mat-card-header>
              <mat-icon mat-card-avatar>{{ getCategoryIcon(guide.category) }}</mat-icon>
              <mat-card-title>{{ guide.title }}</mat-card-title>
              <mat-card-subtitle>{{ getCategoryLabel(guide.category) }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>{{ guide.summary }}</p>
              @if (!isCoach() && isCompleted(guide.id)) {
                <span class="completed-badge">
                  <mat-icon>check_circle</mat-icon> Completed
                </span>
              }
            </mat-card-content>
            <mat-card-actions>
              <a mat-button [routerLink]="['/study-guides', guide.slug]">
                Read Guide
              </a>
              <button mat-button (click)="downloadPdf(guide, $event)">
                <mat-icon>download</mat-icon>
                PDF
              </button>
              @if (isCoach()) {
                <mat-slide-toggle
                  [checked]="!isHidden(guide.id)"
                  (change)="toggleVisibility(guide.id)"
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

      @if (loaded() && filteredGuides().length === 0) {
        <div class="empty-state">
          <mat-icon>search_off</mat-icon>
          <p>No guides found for this category.</p>
        </div>
      }
    </div>

    @if (pdfContent()) {
      <div class="pdf-render-container">
        <div class="markdown-body">
          <markdown [data]="pdfContent()!" katex />
        </div>
      </div>
    }
  `,
  styles: `
    .category-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 24px;
    }

    .category-chips button {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .category-chips button.active {
      background-color: var(--primary-color);
      color: white;
    }

    .completed-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #2e7d32;
      font-size: 14px;
      margin-top: 8px;
    }

    .completed-badge mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
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

    p {
      color: #555;
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

    .pdf-render-container {
      position: absolute;
      left: -9999px;
      top: 0;
      width: 800px;
      background: white;
      padding: 20px;
      font-family: Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
    }
  `,
})
export class StudyGuideListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly resourceService = inject(ResourceService);
  private readonly progressService = inject(ProgressService);
  private readonly pdfService = inject(PdfService);

  protected readonly selectedCategory = signal<ResourceCategory | null>(null);
  protected readonly progressMap = signal<Map<string, ReadingProgress>>(new Map());
  protected readonly pdfContent = signal<string | null>(null);

  protected readonly isCoach = this.authService.isCoach;
  protected readonly loaded = this.resourceService.hiddenGuidesLoaded;

  protected readonly categories = signal<CategoryInfo[]>(this.resourceService.getCategories());

  private readonly allGuides = computed(() =>
    this.resourceService.getAllGuides(this.authService.isCoach())
  );

  protected readonly filteredGuides = computed(() => {
    const category = this.selectedCategory();
    if (!category) return this.allGuides();
    return this.allGuides().filter((g) => g.category === category);
  });

  async ngOnInit(): Promise<void> {
    // Load hidden guides settings
    await this.resourceService.loadHiddenGuides();

    // Check for category query param
    const params = this.route.snapshot.queryParams;
    if (params['category']) {
      this.selectedCategory.set(params['category'] as ResourceCategory);
    }

    // Load progress
    const progressItems = await this.progressService.getAllProgress();
    const map = new Map<string, ReadingProgress>();
    for (const item of progressItems) {
      map.set(item.resourceId, item);
    }
    this.progressMap.set(map);
  }

  protected selectCategory(category: ResourceCategory | null): void {
    this.selectedCategory.set(category);
  }

  protected isCompleted(resourceId: string): boolean {
    return this.progressMap().get(resourceId)?.status === 'completed';
  }

  protected getCategoryIcon(categoryId: ResourceCategory): string {
    return this.categories().find((c) => c.id === categoryId)?.icon ?? 'article';
  }

  protected getCategoryLabel(categoryId: ResourceCategory): string {
    return this.categories().find((c) => c.id === categoryId)?.label ?? '';
  }

  protected isHidden(guideId: string): boolean {
    return this.resourceService.hiddenGuideIds().has(guideId);
  }

  protected async toggleVisibility(guideId: string): Promise<void> {
    await this.resourceService.toggleGuideVisibility(guideId);
  }

  protected downloadPdf(guide: Resource, event: Event): void {
    event.stopPropagation();
    this.http.get(`guides/${guide.fileName}`, { responseType: 'text' }).subscribe({
      next: async (content) => {
        this.pdfContent.set(content);
        // Wait for Angular + ngx-markdown + KaTeX to render
        await new Promise(resolve => setTimeout(resolve, 500));
        const el = document.querySelector('.pdf-render-container .markdown-body');
        if (el) {
          await this.pdfService.generateFromElement(el as HTMLElement, guide.slug);
        }
        this.pdfContent.set(null);
      },
    });
  }
}
