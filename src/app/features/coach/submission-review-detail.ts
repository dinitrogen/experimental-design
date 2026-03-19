import { ChangeDetectionStrategy, Component, inject, signal, input, computed, effect } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { SubmissionService } from '../../core/services/submission.service';
import { ResourceService } from '../../core/services/resource.service';
import { ReportSubmission, CerSection, DataTableEntry, SectionScores, createBlankSectionScores, ManualCalculations } from '../../core/models/submission.model';
import { GraphCanvasComponent } from '../../shared/components/graph-canvas';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog';


@Component({
  selector: 'app-submission-review-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatExpansionModule,
    MatTooltipModule,
    MatDialogModule,
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
            <button mat-raised-button (click)="goBack()">Back to Reviews</button>
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="page-header">
          <button mat-icon-button (click)="goBack()" aria-label="Back to reviews" matTooltip="Back to reviews">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1 class="page-title">{{ eventName() }}</h1>
            <p class="subtitle">Submitted by {{ submission()!.studentDisplayName || submission()!.studentUid }}</p>
          </div>
        </div>

        <div class="scoring-toggle">
          <mat-checkbox
            [checked]="stateNational()"
            (change)="stateNational.set($event.checked)"
          >
            State / National Scoring
          </mat-checkbox>
        </div>

        <!-- Problem & Hypothesis -->
        <mat-card class="section-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>psychology</mat-icon>
            <mat-card-title>Problem & Hypothesis</mat-card-title>
            <span class="spacer"></span>
            <div class="inline-score">
              <input type="number" min="0" [max]="getMax('hypothesis')"
                [value]="sectionScores().hypothesis"
                (input)="updateSectionScore('hypothesis', $event)"
                aria-label="Hypothesis score" />
              <span class="score-max">/ {{ getMax('hypothesis') }}</span>
            </div>
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
            <span class="spacer"></span>
            <div class="inline-score">
              <input type="number" min="0" [max]="getMax('variables')"
                [value]="sectionScores().variables"
                (input)="updateSectionScore('variables', $event)"
                aria-label="Variables score" />
              <span class="score-max">/ {{ getMax('variables') }}</span>
            </div>
          </mat-card-header>
          <mat-card-content>
            <div class="field-group">
              <label class="field-label">Independent Variable</label>
              <p class="field-value">{{ submission()!.independentVar || '(empty)' }}</p>
            </div>
            @if (submission()!.ivOperationalDef) {
              <div class="field-group">
                <label class="field-label">IV — Tools & Operationally Defined</label>
                <p class="field-value">{{ submission()!.ivOperationalDef }}</p>
              </div>
            }
            <div class="field-group">
              <label class="field-label">Dependent Variable</label>
              <p class="field-value">{{ submission()!.dependentVar || '(empty)' }}</p>
            </div>
            @if (submission()!.dvOperationalDef) {
              <div class="field-group">
                <label class="field-label">DV — Tools & Operationally Defined</label>
                <p class="field-value">{{ submission()!.dvOperationalDef }}</p>
              </div>
            }
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
            <span class="spacer"></span>
            <div class="inline-score-group">
              <div class="inline-score">
                <span class="score-label">Mat</span>
                <input type="number" min="0" [max]="getMax('materials')"
                  [value]="sectionScores().materials"
                  (input)="updateSectionScore('materials', $event)"
                  aria-label="Materials score" />
                <span class="score-max">/ {{ getMax('materials') }}</span>
              </div>
              <div class="inline-score">
                <span class="score-label">Proc</span>
                <input type="number" min="0" [max]="getMax('procedureSetup')"
                  [value]="sectionScores().procedureSetup"
                  (input)="updateSectionScore('procedureSetup', $event)"
                  aria-label="Procedure score" />
                <span class="score-max">/ {{ getMax('procedureSetup') }}</span>
              </div>
            </div>
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
            <span class="spacer"></span>
            <div class="inline-score">
              <input type="number" min="0" [max]="getMax('dataTable')"
                [value]="sectionScores().dataTable"
                (input)="updateSectionScore('dataTable', $event)"
                aria-label="Data Table score" />
              <span class="score-max">/ {{ getMax('dataTable') }}</span>
            </div>
          </mat-card-header>
          <mat-card-content>
            @if (submission()!.dataTable.length > 0) {
              <div class="table-scroll">
                <table class="data-table" aria-label="Student data table">
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
            <span class="spacer"></span>
            <div class="inline-score">
              <input type="number" min="0" [max]="getMax('qualitativeObs')"
                [value]="sectionScores().qualitativeObs"
                (input)="updateSectionScore('qualitativeObs', $event)"
                aria-label="Qualitative Observations score" />
              <span class="score-max">/ {{ getMax('qualitativeObs') }}</span>
            </div>
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
            <span class="spacer"></span>
            <div class="inline-score">
              <input type="number" min="0" [max]="getMax('graph')"
                [value]="sectionScores().graph"
                (input)="updateSectionScore('graph', $event)"
                aria-label="Graph score" />
              <span class="score-max">/ {{ getMax('graph') }}</span>
            </div>
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
            <span class="spacer"></span>
            <div class="inline-score">
              <input type="number" min="0" [max]="getMax('statistics')"
                [value]="sectionScores().statistics"
                (input)="updateSectionScore('statistics', $event)"
                aria-label="Statistics score" />
              <span class="score-max">/ {{ getMax('statistics') }}</span>
            </div>
          </mat-card-header>
          <mat-card-content>
            @if (statsCalcs(); as calcs) {
              <!-- Summary Table -->
              <label class="field-label">Summary Table</label>
              <div class="table-scroll">
                <table class="data-table stats-summary" aria-label="Statistics summary table">
                  <thead>
                    <tr>
                      <th>IV Level</th>
                      <th>Mean</th>
                      <th>Median</th>
                      <th>Mode</th>
                      <th>Range</th>
                      <th>Std Dev</th>
                      <th>Variance</th>
                      <th>IQR</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of calcs.summaryTable; track $index) {
                      <tr>
                        <td>{{ submission()!.dataTable[$index]?.ivValue || 'Level ' + ($index + 1) }}</td>
                        <td>{{ row.mean || '—' }}</td>
                        <td>{{ row.median || '—' }}</td>
                        <td>{{ row.mode || '—' }}</td>
                        <td>{{ row.range || '—' }}</td>
                        <td>{{ row.stddev || '—' }}</td>
                        <td>{{ row.variance || '—' }}</td>
                        <td>{{ row.iqr || '—' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Example Calculations -->
              @if (calcs.meanResult || calcs.medianResult || calcs.stddevResult) {
                <mat-accordion class="example-calcs">
                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>Example Calculations (Level {{ calcs.exampleIvIndex + 1 }})</mat-panel-title>
                    </mat-expansion-panel-header>
                    @if (calcs.meanResult) {
                      <div class="calc-row">
                        <span class="calc-label">Mean:</span>
                        <span>({{ calcs.meanValues.join(' + ') }}) / {{ calcs.meanCount }} = <strong>{{ calcs.meanResult }}</strong></span>
                      </div>
                    }
                    @if (calcs.medianResult) {
                      <div class="calc-row">
                        <span class="calc-label">Median:</span>
                        <span>{{ calcs.medianSorted.join(', ') }} → <strong>{{ calcs.medianResult }}</strong></span>
                      </div>
                    }
                    @if (calcs.modeResult) {
                      <div class="calc-row">
                        <span class="calc-label">Mode:</span>
                        <span><strong>{{ calcs.modeResult }}</strong></span>
                      </div>
                    }
                    @if (calcs.rangeResult) {
                      <div class="calc-row">
                        <span class="calc-label">Range:</span>
                        <span>{{ calcs.rangeMax }} − {{ calcs.rangeMin }} = <strong>{{ calcs.rangeResult }}</strong></span>
                      </div>
                    }
                    @if (calcs.stddevResult) {
                      <div class="calc-row">
                        <span class="calc-label">Std Dev:</span>
                        <span>√({{ calcs.stddevSum }} / {{ calcs.stddevDivisor }}) = √{{ calcs.stddevVariance }} = <strong>{{ calcs.stddevResult }}</strong></span>
                      </div>
                    }
                    @if (calcs.iqrResult) {
                      <div class="calc-row">
                        <span class="calc-label">IQR:</span>
                        <span>Q3({{ calcs.iqrQ3 }}) − Q1({{ calcs.iqrQ1 }}) = <strong>{{ calcs.iqrResult }}</strong></span>
                      </div>
                    }
                    @if (calcs.lobfSlope) {
                      <div class="calc-row">
                        <span class="calc-label">LOBF:</span>
                        <span>slope = ({{ calcs.lobfY2 }} − {{ calcs.lobfY1 }}) / ({{ calcs.lobfX2 }} − {{ calcs.lobfX1 }}) = {{ calcs.lobfSlope }}, y-int = <strong>{{ calcs.lobfIntercept }}</strong></span>
                      </div>
                    }
                  </mat-expansion-panel>
                </mat-accordion>
              }
            } @else {
              <p class="field-value">(no calculations entered)</p>
            }

            @if (submission()!.statisticsNotes) {
              <div class="field-group" style="margin-top: 16px">
                <label class="field-label">Notes</label>
                <p class="field-value pre-wrap">{{ submission()!.statisticsNotes }}</p>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Experimental Errors -->
        <mat-card class="section-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>warning</mat-icon>
            <mat-card-title>Experimental Errors</mat-card-title>
            <span class="spacer"></span>
            <div class="inline-score">
              <input type="number" min="0" [max]="getMax('experimentalErrors')"
                [value]="sectionScores().experimentalErrors"
                (input)="updateSectionScore('experimentalErrors', $event)"
                aria-label="Experimental Errors score" />
              <span class="score-max">/ {{ getMax('experimentalErrors') }}</span>
            </div>
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
            <span class="spacer"></span>
            <div class="inline-score">
              <input type="number" min="0" [max]="getMax('cer')"
                [value]="sectionScores().cer"
                (input)="updateSectionScore('cer', $event)"
                aria-label="CER Analysis score" />
              <span class="score-max">/ {{ getMax('cer') }}</span>
            </div>
          </mat-card-header>
          <mat-card-content>
            <mat-accordion>
              @for (section of cerSections(); track section.label) {
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>{{ section.label }}</mat-panel-title>
                  </mat-expansion-panel-header>
                  @if (section.hypothesisRestated) {
                    <div class="field-group">
                      <label class="field-label">Hypothesis Restated</label>
                      <p class="field-value">{{ section.hypothesisRestated }}</p>
                    </div>
                  }
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
            <span class="spacer"></span>
            <div class="inline-score-group">
              <div class="inline-score">
                <span class="score-label">Conc</span>
                <input type="number" min="0" [max]="getMax('conclusion')"
                  [value]="sectionScores().conclusion"
                  (input)="updateSectionScore('conclusion', $event)"
                  aria-label="Conclusion score" />
                <span class="score-max">/ {{ getMax('conclusion') }}</span>
              </div>
              <div class="inline-score">
                <span class="score-label">App</span>
                <input type="number" min="0" [max]="getMax('applicationsRecommendations')"
                  [value]="sectionScores().applicationsRecommendations"
                  (input)="updateSectionScore('applicationsRecommendations', $event)"
                  aria-label="Applications score" />
                <span class="score-max">/ {{ getMax('applicationsRecommendations') }}</span>
              </div>
            </div>
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

        <mat-divider />

        <!-- Coach Feedback Form -->
        <mat-card class="section-card feedback-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>grading</mat-icon>
            <mat-card-title>Coach Feedback</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="total-score-row">
              <span class="total-label">Total Score:</span>
              <span class="total-value">{{ totalScore() }} / {{ maxTotal() }}</span>
            </div>

            <form [formGroup]="feedbackForm">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Feedback</mat-label>
                <textarea
                  matInput
                  formControlName="feedback"
                  rows="6"
                  placeholder="Write feedback for the student..."
                ></textarea>
              </mat-form-field>
            </form>
          </mat-card-content>
          <mat-card-actions align="end">
            <button
              mat-button
              color="warn"
              (click)="deleteSubmission()"
              matTooltip="Delete this submission completely"
            >
              <mat-icon>delete</mat-icon>
              Delete Submission
            </button>
            <span class="spacer"></span>
            <button
              mat-raised-button
              color="primary"
              (click)="saveReview()"
              [disabled]="saving()"
            >
              @if (saving()) {
                <mat-spinner diameter="20" />
              } @else {
                {{ submission()!.status === 'reviewed' ? 'Update Review' : 'Submit Review' }}
              }
            </button>
          </mat-card-actions>
        </mat-card>
      }
    </div>
  `,
  styles: `
    .page-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
    }

    .page-header .page-title {
      margin: 0;
    }

    .subtitle {
      margin: 0;
      color: #666;
      font-size: 14px;
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

    .list-item {
      margin-left: 8px;
    }

    .sub-field {
      margin: 4px 0 0 16px;
      font-size: 14px;
      color: #555;
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

    .feedback-card {
      margin-top: 24px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 8px;
    }

    .spacer {
      flex: 1;
    }

    .scoring-toggle {
      margin-bottom: 16px;
    }

    mat-card-header {
      display: flex;
      align-items: center;
    }

    .inline-score {
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
    }

    .inline-score input {
      width: 48px;
      padding: 4px 6px;
      border: 1px solid #ccc;
      border-radius: 4px;
      text-align: center;
      font-size: 14px;
    }

    .inline-score .score-max {
      font-size: 14px;
      color: #666;
    }

    .inline-score .score-label {
      font-size: 11px;
      color: #888;
      text-transform: uppercase;
    }

    .inline-score-group {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .total-score-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      font-size: 18px;
      font-weight: 500;
    }

    .total-value {
      color: #1976d2;
    }

    .stats-summary th,
    .stats-summary td {
      font-size: 13px;
      padding: 6px 8px;
    }

    .example-calcs {
      margin-top: 16px;
    }

    .calc-row {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 14px;
      line-height: 1.5;
    }

    .calc-label {
      font-weight: 500;
      white-space: nowrap;
      color: #666;
    }
  `,
})
export class SubmissionReviewDetailComponent {
  readonly id = input.required<string>();

  private readonly submissionService = inject(SubmissionService);
  private readonly resourceService = inject(ResourceService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);

  protected readonly submission = signal<ReportSubmission | null>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);

  protected readonly feedbackForm = this.fb.group({
    feedback: [''],
  });

  protected readonly sectionScores = signal<SectionScores>(createBlankSectionScores());

  protected readonly stateNational = signal(false);

  private readonly maxPoints = computed<Record<keyof SectionScores, number>>(() => {
    const sn = this.stateNational();
    return {
      problemStatement: 2,
      hypothesis: 6,
      variables: 15,
      materials: 4,
      procedureSetup: 13,
      qualitativeObs: 6,
      dataTable: 5,
      graph: 12,
      statistics: sn ? 11 : 9,
      experimentalErrors: 6,
      cer: sn ? 18 : 12,
      conclusion: 8,
      applicationsRecommendations: sn ? 12 : 8,
    };
  });

  protected readonly maxTotal = computed(() =>
    Object.values(this.maxPoints()).reduce((sum, v) => sum + v, 0),
  );

  protected readonly totalScore = computed(() => {
    const scores = this.sectionScores();
    const mp = this.maxPoints();
    return (Object.keys(mp) as (keyof SectionScores)[]).reduce(
      (sum, key) => sum + (scores[key] ?? 0),
      0,
    );
  });

  protected getMax(key: keyof SectionScores): number {
    return this.maxPoints()[key];
  }

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

  protected readonly statsCalcs = computed(() => {
    const sub = this.submission();
    if (!sub?.manualCalculations) return null;
    const c = sub.manualCalculations;
    const hasData = c.summaryTable.some(r => r.mean || r.median || r.stddev);
    return hasData ? c : null;
  });

  protected readonly noErrors = computed(() => {
    const sub = this.submission();
    if (!sub) return true;
    return sub.errors.every((e) => !e.specificError && !e.resultImpact);
  });

  protected readonly cerSections = computed((): { label: string; data: CerSection; hypothesisRestated?: string }[] => {
    const sub = this.submission();
    if (!sub) return [];
    return [
      { label: 'Data Trend', data: sub.cerTrend },
      { label: 'Outliers', data: sub.cerOutliers },
      { label: 'Variation (State/Nationals)', data: sub.cerVariation },
      { label: 'Conclusion', data: sub.cerConclusion, hypothesisRestated: sub.cerConclusionHypothesisRestated },
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
      if (sub) {
        this.feedbackForm.patchValue({
          feedback: sub.coachFeedback,
        });
        this.sectionScores.set(sub.sectionScores ?? createBlankSectionScores());
        this.stateNational.set(sub.isStateNational ?? false);
      }
    } finally {
      this.loading.set(false);
    }
  }

  protected getTrialValue(row: DataTableEntry, trialNum: number): number | null {
    return row[`trial${trialNum}` as keyof DataTableEntry] as number | null;
  }

  protected updateSectionScore(key: keyof SectionScores, event: Event): void {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.sectionScores.update((s) => ({ ...s, [key]: isNaN(value) ? null : value }));
  }

  protected async saveReview(): Promise<void> {
    const sub = this.submission();
    if (!sub?.id) return;

    this.saving.set(true);
    try {
      const { feedback } = this.feedbackForm.value;
      const scores = this.sectionScores();
      const total = this.totalScore();
      await this.submissionService.saveReview(sub.id, feedback ?? '', total, scores, this.stateNational());
      this.submission.update((s) => s ? { ...s, status: 'reviewed' as const } : s);
      this.snackBar.open('Review saved!', 'OK', { duration: 3000 });
    } finally {
      this.saving.set(false);
    }
  }

  protected goBack(): void {
    this.router.navigate(['/coach/submissions']);
  }

  protected deleteSubmission(): void {
    const sub = this.submission();
    if (!sub?.id) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete Submission',
        message: `Permanently delete this submission? The student will be able to start a new report for this event.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
        icon: 'delete_forever',
      },
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) return;
      try {
        await this.submissionService.deleteSubmission(sub.id!);
        this.snackBar.open('Submission deleted.', 'OK', { duration: 3000 });
        this.router.navigate(['/coach/submissions']);
      } catch {
        this.snackBar.open('Failed to delete submission. Please try again.', 'OK', { duration: 5000 });
      }
    });
  }
}
