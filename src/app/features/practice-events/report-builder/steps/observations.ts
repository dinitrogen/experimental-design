import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ReportSubmission } from '../../../../core/models/submission.model';

@Component({
  selector: 'app-step-observations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <div class="step-content">
      <h3>
        <mat-icon>visibility</mat-icon>
        Qualitative Observations
      </h3>
      @if (showHints()) {
        <p class="hint">
          Describe what you observed during the experiment — things you noticed with your senses
          that aren't captured in the numbers. Write observations for each phase below.
        </p>
      }

      <h4>
        <mat-icon>build</mat-icon>
        Setup Observations
      </h4>
      @if (showHints()) {
        <p class="hint">What did you notice while setting up the experiment?</p>
      }
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Setup Observations</mat-label>
        <textarea
          matInput
          rows="4"
          [ngModel]="qualitativeObsSetup()"
          (ngModelChange)="changed.emit({ qualitativeObsSetup: $event })"
          [placeholder]="showHints() ? 'e.g., The materials felt lightweight, the surface was smooth...' : ''"
        ></textarea>
      </mat-form-field>

      <h4>
        <mat-icon>play_circle</mat-icon>
        Procedure Observations
      </h4>
      @if (showHints()) {
        <p class="hint">What did you observe while running your trials?</p>
      }
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Procedure Observations</mat-label>
        <textarea
          matInput
          rows="4"
          [ngModel]="qualitativeObsProcedure()"
          (ngModelChange)="changed.emit({ qualitativeObsProcedure: $event })"
          [placeholder]="showHints() ? 'e.g., During each trial we noticed..., the parachute drifted sideways...' : ''"
        ></textarea>
      </mat-form-field>

      <h4>
        <mat-icon>lightbulb</mat-icon>
        Results Observations
      </h4>
      @if (showHints()) {
        <p class="hint">What patterns, surprises, or unexpected results did you notice?</p>
      }
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Results Observations</mat-label>
        <textarea
          matInput
          rows="4"
          [ngModel]="qualitativeObsResults()"
          (ngModelChange)="changed.emit({ qualitativeObsResults: $event })"
          [placeholder]="showHints() ? 'e.g., The largest canopy took noticeably longer, one trial seemed like an outlier...' : ''"
        ></textarea>
      </mat-form-field>
    </div>
  `,
  styles: `
    .step-content { max-width: 720px; }
    .full-width { width: 100%; }
    h3 { display: flex; align-items: center; gap: 8px; margin: 8px 0 4px; font-weight: 500; }
    h4 { display: flex; align-items: center; gap: 8px; margin: 16px 0 4px; font-weight: 500; font-size: 15px; }
    .hint { color: #666; font-size: 14px; margin: 0 0 12px; }
  `,
})
export class ObservationsStepComponent {
  readonly qualitativeObsSetup = input('');
  readonly qualitativeObsProcedure = input('');
  readonly qualitativeObsResults = input('');
  readonly showHints = input(true);
  readonly changed = output<Partial<ReportSubmission>>();
}
