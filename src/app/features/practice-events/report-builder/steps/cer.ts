import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { ReportSubmission, CerSection } from '../../../../core/models/submission.model';

@Component({
  selector: 'app-step-cer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatExpansionModule],
  template: `
    <div class="step-content">
      <h3>
        <mat-icon>analytics</mat-icon>
        CER Analysis
      </h3>
      @if (showHints()) {
        <p class="hint">
          Write Claim / Evidence / Reasoning for each category.
          Each claim should be a specific, measurable statement supported by your data.
        </p>
      }

      <mat-accordion>
        <mat-expansion-panel expanded>
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>trending_up</mat-icon>
              Data Trend CER
            </mat-panel-title>
          </mat-expansion-panel-header>
          <div class="cer-fields">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Claim</mat-label>
              <textarea matInput rows="2"
                [ngModel]="cerTrend().claim"
                (ngModelChange)="emitCer('cerTrend', 'claim', $event)"
                [placeholder]="showHints() ? 'As [IV] increased, [DV] [increased/decreased]...' : ''"
              ></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Evidence</mat-label>
              <textarea matInput rows="2"
                [ngModel]="cerTrend().evidence"
                (ngModelChange)="emitCer('cerTrend', 'evidence', $event)"
                [placeholder]="showHints() ? 'According to the data, when [IV] was [value], the mean [DV] was [value]...' : ''"
              ></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Reasoning</mat-label>
              <textarea matInput rows="2"
                [ngModel]="cerTrend().reasoning"
                (ngModelChange)="emitCer('cerTrend', 'reasoning', $event)"
                [placeholder]="showHints() ? 'This makes sense because [scientific explanation]...' : ''"
              ></textarea>
            </mat-form-field>
          </div>
        </mat-expansion-panel>

        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>scatter_plot</mat-icon>
              Outliers CER
            </mat-panel-title>
          </mat-expansion-panel-header>
          <div class="cer-fields">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Claim</mat-label>
              <textarea matInput rows="2"
                [ngModel]="cerOutliers().claim"
                (ngModelChange)="emitCer('cerOutliers', 'claim', $event)"
                [placeholder]="showHints() ? 'Using the 1.5 × IQR rule, [there were / there were no] outliers...' : ''"
              ></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Evidence</mat-label>
              <textarea matInput rows="2"
                [ngModel]="cerOutliers().evidence"
                (ngModelChange)="emitCer('cerOutliers', 'evidence', $event)"
                [placeholder]="showHints() ? 'Q1 = [value], Q3 = [value], IQR = [value]. Lower fence = [Q1 - 1.5×IQR], Upper fence = [Q3 + 1.5×IQR]...' : ''"
              ></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Reasoning</mat-label>
              <textarea matInput rows="2"
                [ngModel]="cerOutliers().reasoning"
                (ngModelChange)="emitCer('cerOutliers', 'reasoning', $event)"
                [placeholder]="showHints() ? 'Any outliers may have been caused by...' : ''"
              ></textarea>
            </mat-form-field>
          </div>
        </mat-expansion-panel>

        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>bar_chart</mat-icon>
              Variation CER
              <span class="level-label">(State/Nationals only)</span>
            </mat-panel-title>
          </mat-expansion-panel-header>
          <div class="cer-fields">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Claim</mat-label>
              <textarea matInput rows="2"
                [ngModel]="cerVariation().claim"
                (ngModelChange)="emitCer('cerVariation', 'claim', $event)"
                [placeholder]="showHints() ? 'The data showed [high/low] variation, with a standard deviation of...' : ''"
              ></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Evidence</mat-label>
              <textarea matInput rows="2"
                [ngModel]="cerVariation().evidence"
                (ngModelChange)="emitCer('cerVariation', 'evidence', $event)"
                [placeholder]="showHints() ? 'The standard deviation was [value] and the IQR was [value]...' : ''"
              ></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Reasoning</mat-label>
              <textarea matInput rows="2"
                [ngModel]="cerVariation().reasoning"
                (ngModelChange)="emitCer('cerVariation', 'reasoning', $event)"
                [placeholder]="showHints() ? 'This level of variation suggests...' : ''"
              ></textarea>
            </mat-form-field>
          </div>
        </mat-expansion-panel>

        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>check_circle</mat-icon>
              Conclusion CER
            </mat-panel-title>
          </mat-expansion-panel-header>
          <div class="cer-fields">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Hypothesis Restated</mat-label>
              <textarea matInput rows="2"
                [ngModel]="cerConclusionHypothesisRestated()"
                (ngModelChange)="changed.emit({ cerConclusionHypothesisRestated: $event })"
                [placeholder]="showHints() ? 'Restate your hypothesis here before writing C/E/R...' : ''"
              ></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Claim</mat-label>
              <textarea matInput rows="2"
                [ngModel]="cerConclusion().claim"
                (ngModelChange)="emitCer('cerConclusion', 'claim', $event)"
                [placeholder]="showHints() ? 'The hypothesis was [supported/not supported]...' : ''"
              ></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Evidence</mat-label>
              <textarea matInput rows="2"
                [ngModel]="cerConclusion().evidence"
                (ngModelChange)="emitCer('cerConclusion', 'evidence', $event)"
                [placeholder]="showHints() ? 'The line of best fit equation y = mx + b shows...' : ''"
              ></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Reasoning</mat-label>
              <textarea matInput rows="2"
                [ngModel]="cerConclusion().reasoning"
                (ngModelChange)="emitCer('cerConclusion', 'reasoning', $event)"
                [placeholder]="showHints() ? 'This conclusion is valid because...' : ''"
              ></textarea>
            </mat-form-field>
          </div>
        </mat-expansion-panel>
      </mat-accordion>
    </div>
  `,
  styles: `
    .step-content { max-width: 720px; }
    .full-width { width: 100%; }
    h3 { display: flex; align-items: center; gap: 8px; margin: 8px 0 4px; font-weight: 500; }
    .hint { color: #666; font-size: 14px; margin: 0 0 16px; }

    mat-panel-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .level-label {
      font-size: 12px;
      font-weight: 400;
      color: #1565c0;
      font-style: italic;
    }

    .cer-fields {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: 8px;
    }
  `,
})
export class CerStepComponent {
  readonly cerTrend = input<CerSection>({ claim: '', evidence: '', reasoning: '' });
  readonly cerVariation = input<CerSection>({ claim: '', evidence: '', reasoning: '' });
  readonly cerOutliers = input<CerSection>({ claim: '', evidence: '', reasoning: '' });
  readonly cerConclusion = input<CerSection>({ claim: '', evidence: '', reasoning: '' });
  readonly cerConclusionHypothesisRestated = input('');
  readonly showHints = input(true);
  readonly changed = output<Partial<ReportSubmission>>();

  protected emitCer(
    section: 'cerTrend' | 'cerVariation' | 'cerOutliers' | 'cerConclusion',
    field: keyof CerSection,
    value: string
  ): void {
    const current = this[section]();
    this.changed.emit({ [section]: { ...current, [field]: value } });
  }
}
