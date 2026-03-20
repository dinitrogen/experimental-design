import { ChangeDetectionStrategy, Component, inject, signal, input, computed, effect } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SubmissionService } from '../../core/services/submission.service';
import { ResourceService } from '../../core/services/resource.service';
import { ReportSubmission, CerSection, DataTableEntry, SectionScores } from '../../core/models/submission.model';
import { GraphCanvasComponent } from '../../shared/components/graph-canvas';

@Component({
  selector: 'app-submission-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatChipsModule,
    MatTooltipModule,
    TitleCasePipe,
    GraphCanvasComponent,
  ],
  template: `
    <div class="content-container">
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48" />
        </div>
      } @else if (!submission()) {
        <mat-card>
          <mat-card-content class="empty-state">
            <mat-icon>error_outline</mat-icon>
            <h2>Submission Not Found</h2>
            <button mat-raised-button (click)="goBack()">Back to Dashboard</button>
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="page-header">
          <button mat-icon-button (click)="goBack()" aria-label="Back to dashboard" matTooltip="Back to dashboard">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1 class="page-title">{{ eventName() }}</h1>
            <div class="status-row">
              <mat-chip [highlighted]="submission()!.status === 'reviewed'"
                        [class]="'status-chip status-' + submission()!.status">
                @switch (submission()!.status) {
                  @case ('draft') { <mat-icon>edit</mat-icon> Draft }
                  @case ('submitted') { <mat-icon>send</mat-icon> Submitted — Awaiting Review }
                  @case ('reviewed') { <mat-icon>check_circle</mat-icon> Reviewed }
                }
              </mat-chip>
              @if (submission()!.score != null) {
                <span class="score-badge">Score: {{ submission()!.score }} / {{ maxTotal() }}</span>
              }
            </div>
          </div>
        </div>

        <!-- Coach Feedback (shown prominently if reviewed) -->
        @if (submission()!.status === 'reviewed') {
          <mat-card class="section-card feedback-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>grading</mat-icon>
              <mat-card-title>Coach Feedback</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if (submission()!.score != null) {
                <div class="field-group">
                  <label class="field-label">Score</label>
                  <p class="field-value score-display">{{ submission()!.score }} / {{ maxTotal() }}</p>
                </div>
              }
              <div class="field-group">
                <label class="field-label">Feedback</label>
                <p class="field-value pre-wrap">{{ submission()!.coachFeedback || '(no written feedback)' }}</p>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-divider />
        }

        <!-- Problem & Hypothesis -->
        <mat-card class="section-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>psychology</mat-icon>
            <mat-card-title>Problem & Hypothesis</mat-card-title>
            @if (hasScores()) {
              <span class="spacer"></span>
              <span class="section-score">{{ sectionScore('hypothesis') }} / {{ getMax('hypothesis') }}</span>
            }
          </mat-card-header>
          <mat-card-content>
            <div class="field-group">
              <label class="field-label">Problem Statement</label>
              <p class="field-value">{{ submission()!.problemStatement || '(empty)' }}</p>
            </div>
            <div class="field-group">
              <label class="field-label">Hypothesis</label>
              <p class="field-value">{{ submission()!.hypothesis || '(empty)' }}</p>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Variables -->
        <mat-card class="section-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>tune</mat-icon>
            <mat-card-title>Variables</mat-card-title>
            @if (hasScores()) {
              <span class="spacer"></span>
              <span class="section-score">{{ sectionScore('variables') }} / {{ getMax('variables') }}</span>
            }
          </mat-card-header>
          <mat-card-content>
            <div class="field-group">
              <label class="field-label">Independent Variable</label>
              <p class="field-value">{{ submission()!.independentVar || '(empty)' }}</p>
            </div>
            <div class="field-group">
              <label class="field-label">Dependent Variable</label>
              <p class="field-value">{{ submission()!.dependentVar || '(empty)' }}</p>
            </div>
            <div class="field-group">
              <label class="field-label">Controlled Variables</label>
              @for (cv of submission()!.controlledVars; track $index) {
                @if (cv) {
                  <p class="field-value list-item">{{ $index + 1 }}. {{ cv }}</p>
                }
              }
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Materials & Procedure -->
        <mat-card class="section-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>build</mat-icon>
            <mat-card-title>Materials & Procedure</mat-card-title>
            @if (hasScores()) {
              <span class="spacer"></span>
              <span class="section-score-group">
                <span class="section-score">Mat {{ sectionScore('materials') }}/{{ getMax('materials') }}</span>
                <span class="section-score">Proc {{ sectionScore('procedureSetup') }}/{{ getMax('procedureSetup') }}</span>
              </span>
            }
          </mat-card-header>
          <mat-card-content>
            <div class="field-group">
              <label class="field-label">Materials</label>
              <p class="field-value pre-wrap">{{ submission()!.materials || '(empty)' }}</p>
            </div>
            <div class="field-group">
              <label class="field-label">Procedure</label>
              <p class="field-value pre-wrap">{{ submission()!.procedure || '(empty)' }}</p>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Data Table -->
        <mat-card class="section-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>table_chart</mat-icon>
            <mat-card-title>Data Table</mat-card-title>
            @if (hasScores()) {
              <span class="spacer"></span>
              <span class="section-score">{{ sectionScore('dataTable') }} / {{ getMax('dataTable') }}</span>
            }
          </mat-card-header>
          <mat-card-content>
            @if (submission()!.dataTable.length > 0) {
              <div class="table-scroll">
                <table class="data-table" aria-label="Your data table">
                  <thead>
                    <tr>
                      <th>IV Level</th>
                      @for (i of trialColumns(); track i) {
                        <th>Trial {{ i }}</th>
                      }
                      <th>Mean</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of submission()!.dataTable; track $index) {
                      <tr>
                        <td>{{ row.ivValue || '—' }}</td>
                        @for (i of trialColumns(); track i) {
                          <td>{{ getTrialValue(row, i) ?? '—' }}</td>
                        }
                        <td>{{ row.mean != null ? row.mean : '—' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <p class="field-value">(no data entered)</p>
            }
          </mat-card-content>
        </mat-card>

        <!-- Observations -->
        <mat-card class="section-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>visibility</mat-icon>
            <mat-card-title>Qualitative Observations</mat-card-title>
            @if (hasScores()) {
              <span class="spacer"></span>
              <span class="section-score">{{ sectionScore('qualitativeObs') }} / {{ getMax('qualitativeObs') }}</span>
            }
          </mat-card-header>
          <mat-card-content>
            <div class="field-group">
              <label class="field-label">Setup Observations</label>
              <p class="field-value pre-wrap">{{ submission()!.qualitativeObsSetup || '(empty)' }}</p>
            </div>
            <div class="field-group">
              <label class="field-label">Procedure Observations</label>
              <p class="field-value pre-wrap">{{ submission()!.qualitativeObsProcedure || '(empty)' }}</p>
            </div>
            <div class="field-group">
              <label class="field-label">Results Observations</label>
              <p class="field-value pre-wrap">{{ submission()!.qualitativeObsResults || '(empty)' }}</p>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Graph -->
        <mat-card class="section-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>show_chart</mat-icon>
            <mat-card-title>Graph</mat-card-title>
            @if (hasScores()) {
              <span class="spacer"></span>
              <span class="section-score">{{ sectionScore('graph') }} / {{ getMax('graph') }}</span>
            }
          </mat-card-header>
          <mat-card-content>
            @if (submission()!.graphData) {
              <app-graph-canvas [graphData]="submission()!.graphData!" [isReadonly]="true" />
            } @else {
              <p class="field-value">{{ submission()!.graphUrl || '(no graph provided)' }}</p>
            }
          </mat-card-content>
        </mat-card>

        <!-- Statistics -->
        <mat-card class="section-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>calculate</mat-icon>
            <mat-card-title>Statistics</mat-card-title>
            @if (hasScores()) {
              <span class="spacer"></span>
              <span class="section-score">{{ sectionScore('statistics') }} / {{ getMax('statistics') }}</span>
            }
          </mat-card-header>
          <mat-card-content>
            @if (submission()!.statisticsNotes) {
              <p class="field-value pre-wrap">{{ submission()!.statisticsNotes }}</p>
            } @else {
              <p class="field-value">(no notes)</p>
            }
          </mat-card-content>
        </mat-card>

        <!-- Experimental Errors -->
        <mat-card class="section-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>warning</mat-icon>
            <mat-card-title>Experimental Errors</mat-card-title>
            @if (hasScores()) {
              <span class="spacer"></span>
              <span class="section-score">{{ sectionScore('experimentalErrors') }} / {{ getMax('experimentalErrors') }}</span>
            }
          </mat-card-header>
          <mat-card-content>
            @for (error of submission()!.errors; track $index) {
              @if (error.specificError || error.resultImpact) {
                <div class="field-group">
                  <label class="field-label">{{ error.type | titlecase }}</label>
                  @if (error.specificError) {
                    <p class="field-value"><strong>Specific Error:</strong> {{ error.specificError }}</p>
                  }
                  @if (error.resultImpact) {
                    <p class="field-value sub-field"><strong>Impact on Results:</strong> {{ error.resultImpact }}</p>
                  }
                </div>
              }
            }
            @if (noErrors()) {
              <p class="field-value">(no errors described)</p>
            }
          </mat-card-content>
        </mat-card>

        <!-- CER Analysis -->
        <mat-card class="section-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>edit_note</mat-icon>
            <mat-card-title>CER Analysis</mat-card-title>
            @if (hasScores()) {
              <span class="spacer"></span>
              <span class="section-score">{{ sectionScore('cer') }} / {{ getMax('cer') }}</span>
            }
          </mat-card-header>
          <mat-card-content>
            <mat-accordion>
              @for (section of cerSections(); track section.label) {
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>{{ section.label }}</mat-panel-title>
                  </mat-expansion-panel-header>
                  <div class="field-group">
                    <label class="field-label">Claim</label>
                    <p class="field-value">{{ section.data.claim || '(empty)' }}</p>
                  </div>
                  <div class="field-group">
                    <label class="field-label">Evidence</label>
                    <p class="field-value">{{ section.data.evidence || '(empty)' }}</p>
                  </div>
                  <div class="field-group">
                    <label class="field-label">Reasoning</label>
                    <p class="field-value">{{ section.data.reasoning || '(empty)' }}</p>
                  </div>
                </mat-expansion-panel>
              }
            </mat-accordion>
          </mat-card-content>
        </mat-card>

        <!-- Applications & Improvements -->
        <mat-card class="section-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>lightbulb</mat-icon>
            <mat-card-title>Applications & Improvements</mat-card-title>
            @if (hasScores()) {
              <span class="spacer"></span>
              <span class="section-score-group">
                <span class="section-score">Conc {{ sectionScore('conclusion') }}/{{ getMax('conclusion') }}</span>
                <span class="section-score">App {{ sectionScore('applicationsRecommendations') }}/{{ getMax('applicationsRecommendations') }}</span>
              </span>
            }
          </mat-card-header>
          <mat-card-content>
            <div class="field-group">
              <label class="field-label">Improvements</label>
              <p class="field-value pre-wrap">{{ submission()!.improvements || '(empty)' }}</p>
            </div>
            <div class="field-group">
              <label class="field-label">Real-World Applications</label>
              <p class="field-value pre-wrap">{{ submission()!.applications || '(empty)' }}</p>
            </div>
            <div class="field-group">
              <label class="field-label">Future Experiments</label>
              <p class="field-value pre-wrap">{{ submission()!.futureExperiments || '(empty)' }}</p>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: `
    .page-header {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 24px;
    }

    .page-header .page-title {
      margin: 0 0 4px;
    }

    .status-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .status-chip mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 4px;
    }

    .status-draft { --mdc-chip-label-text-color: #666; }
    .status-submitted { --mdc-chip-label-text-color: #e65100; }
    .status-reviewed { --mdc-chip-label-text-color: #2e7d32; }

    .score-badge {
      font-size: 16px;
      font-weight: 500;
      color: var(--primary-color);
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .empty-state {
      text-align: center;
      padding: 48px 16px;
    }

    .section-card {
      margin-bottom: 16px;
    }

    .feedback-card {
      border-left: 4px solid #2e7d32;
    }

    .field-group {
      margin-bottom: 16px;
    }

    .field-label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .field-value {
      margin: 0;
      font-size: 15px;
      line-height: 1.5;
    }

    .field-value.pre-wrap {
      white-space: pre-wrap;
    }

    .score-display {
      font-size: 24px;
      font-weight: 500;
      color: var(--primary-color);
    }

    .list-item {
      margin-left: 8px;
    }

    .table-scroll {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    .data-table th,
    .data-table td {
      border: 1px solid #ddd;
      padding: 8px 12px;
      text-align: center;
    }

    .data-table th {
      background: #f5f5f5;
      font-weight: 500;
    }

    mat-divider {
      margin: 24px 0;
    }

    .spacer {
      flex: 1;
    }

    mat-card-header {
      display: flex;
      align-items: center;
    }

    .section-score {
      font-size: 13px;
      font-weight: 500;
      color: #1565c0;
      white-space: nowrap;
    }

    .section-score-group {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .sub-field {
      margin: 4px 0 0 16px;
      font-size: 14px;
      color: #555;
    }
  `,
})
export class SubmissionViewComponent {
  readonly id = input.required<string>();

  private readonly submissionService = inject(SubmissionService);
  private readonly resourceService = inject(ResourceService);
  private readonly router = inject(Router);

  protected readonly submission = signal<ReportSubmission | null>(null);
  protected readonly loading = signal(true);

  protected readonly eventName = computed(() => {
    const sub = this.submission();
    if (!sub) return '';
    return this.resourceService.getGuideBySlug(sub.practiceEventId)?.title ?? sub.practiceEventId;
  });

  protected readonly trialColumns = computed(() => {
    const sub = this.submission();
    const numTrials = sub?.numTrials ?? 5;
    return Array.from({ length: numTrials }, (_, i) => i + 1);
  });

  protected readonly noErrors = computed(() => {
    const sub = this.submission();
    if (!sub) return true;
    return sub.errors.every((e) => !e.specificError && !e.resultImpact);
  });

  private static readonly MAX_REGIONAL: Record<keyof SectionScores, number> = {
    problemStatement: 2, hypothesis: 6, variables: 15, materials: 4,
    procedureSetup: 13, qualitativeObs: 6, dataTable: 5, graph: 12,
    statistics: 9, experimentalErrors: 6, cer: 12, conclusion: 8,
    applicationsRecommendations: 8,
  };

  private static readonly MAX_STATE: Record<keyof SectionScores, number> = {
    ...SubmissionViewComponent.MAX_REGIONAL,
    statistics: 11, cer: 18, applicationsRecommendations: 12,
  };

  private static readonly REGIONAL_TOTAL = Object.values(SubmissionViewComponent.MAX_REGIONAL).reduce((s, v) => s + v, 0); // 106
  private static readonly STATE_TOTAL = Object.values(SubmissionViewComponent.MAX_STATE).reduce((s, v) => s + v, 0);

  private readonly maxMap = computed(() => {
    const sub = this.submission();
    return sub?.isStateNational
      ? SubmissionViewComponent.MAX_STATE
      : SubmissionViewComponent.MAX_REGIONAL;
  });

  protected readonly maxTotal = computed(() => {
    const sub = this.submission();
    return sub?.isStateNational
      ? SubmissionViewComponent.STATE_TOTAL
      : SubmissionViewComponent.REGIONAL_TOTAL;
  });

  protected readonly hasScores = computed(() => {
    const sub = this.submission();
    if (!sub?.sectionScores || sub.status !== 'reviewed') return false;
    return Object.values(sub.sectionScores).some(v => v != null);
  });

  protected getMax(key: keyof SectionScores): number {
    return this.maxMap()[key];
  }

  protected sectionScore(key: keyof SectionScores): string {
    const val = this.submission()?.sectionScores?.[key];
    return val != null ? String(val) : '–';
  }

  protected readonly cerSections = computed((): { label: string; data: CerSection }[] => {
    const sub = this.submission();
    if (!sub) return [];
    return [
      { label: 'Data Trend', data: sub.cerTrend },
      { label: 'Variation', data: sub.cerVariation },
      { label: 'Outliers', data: sub.cerOutliers },
      { label: 'Conclusion', data: sub.cerConclusion },
    ];
  });

  constructor() {
    effect(() => {
      const id = this.id();
      this.loadSubmission(id);
    });
  }

  private async loadSubmission(submissionId: string): Promise<void> {
    try {
      this.loading.set(true);
      const sub = await this.submissionService.getById(submissionId);
      this.submission.set(sub);
    } finally {
      this.loading.set(false);
    }
  }

  protected getTrialValue(row: DataTableEntry, trialNum: number): number | null {
    return row[`trial${trialNum}` as keyof DataTableEntry] as number | null;
  }

  protected goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
