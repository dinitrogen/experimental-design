import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MarkdownComponent } from 'ngx-markdown';
import { ResourceService } from '../../../../core/services/resource.service';

@Component({
  selector: 'app-step-prompt',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MarkdownComponent,
  ],
  template: `
    <div class="step-content">
      <mat-card class="prompt-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>description</mat-icon>
          <mat-card-title>Event Prompt</mat-card-title>
          <mat-card-subtitle>
            Read the prompt carefully, then proceed to the next step to begin your report.
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (loading()) {
            <div class="loading-container">
              <mat-spinner diameter="32" />
            </div>
          } @else {
            <div class="markdown-body">
              <markdown [data]="markdownContent()" katex></markdown>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .step-content { max-width: 960px; }
    .prompt-card mat-card-content { padding: 16px; }
    .loading-container { display: flex; justify-content: center; padding: 24px; }
  `,
})
export class PromptStepComponent implements OnInit {
  readonly practiceEventId = input.required<string>();

  private readonly http = inject(HttpClient);
  private readonly resourceService = inject(ResourceService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly markdownContent = signal('');

  ngOnInit(): void {
    const guide = this.resourceService.getGuideBySlug(this.practiceEventId());
    if (!guide) {
      this.markdownContent.set('*Event prompt could not be loaded.*');
      this.loading.set(false);
      return;
    }

    this.http.get(`guides/${guide.fileName}`, { responseType: 'text' }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (content) => {
        this.markdownContent.set(content);
        this.loading.set(false);
      },
      error: () => {
        this.markdownContent.set('*Event prompt could not be loaded.*');
        this.loading.set(false);
      },
    });
  }
}
