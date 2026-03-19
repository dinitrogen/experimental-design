import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ReportSubmission } from '../../../../core/models/submission.model';

@Component({
  selector: 'app-step-applications',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <div class="step-content">
      <h3>
        <mat-icon>build</mat-icon>
        Improvements
      </h3>
      @if (showHints()) {
        <p class="hint">
          What would you change if you could run this experiment again?
          List at least 3 specific improvements.
        </p>
      }
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Improvements</mat-label>
        <textarea
          matInput
          rows="4"
          [ngModel]="improvements()"
          (ngModelChange)="changed.emit({ improvements: $event })"
          [placeholder]="showHints() ? '1. Use a digital sensor instead of a manual stopwatch to reduce random error.\n2. Test more IV levels (6+) to get a more accurate line of best fit.\n3. Run 5 trials per level instead of 3 to reduce variability.' : ''"
        ></textarea>
      </mat-form-field>

      <h3>
        <mat-icon>public</mat-icon>
        Real-World Applications
      </h3>
      @if (showHints()) {
        <p class="hint">
          How could the results of your experiment be useful in the real world?
          List at least 3 practical applications.
        </p>
      }
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Applications</mat-label>
        <textarea
          matInput
          rows="4"
          [ngModel]="applications()"
          (ngModelChange)="changed.emit({ applications: $event })"
          [placeholder]="showHints() ? '1. Understanding parachute size helps design emergency supply drops.\n2. Airlines could optimize cargo parachute dimensions to save materials.\n3. Skydivers use similar principles to choose between different canopy sizes.' : ''"
        ></textarea>
      </mat-form-field>

      <h3>
        <mat-icon>explore</mat-icon>
        Future Experiments
      </h3>
      @if (showHints()) {
        <p class="hint">
          What related experiments could be done next? List at least 2 ideas.
        </p>
      }
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Future Experiments</mat-label>
        <textarea
          matInput
          rows="4"
          [ngModel]="futureExperiments()"
          (ngModelChange)="changed.emit({ futureExperiments: $event })"
          [placeholder]="showHints() ? '1. Test how canopy shape (circle vs. square vs. octagon) affects drop time.\n2. Investigate the effect of adding holes in the canopy on stability.' : ''"
        ></textarea>
      </mat-form-field>
    </div>
  `,
  styles: `
    .step-content { max-width: 720px; }
    .full-width { width: 100%; }
    h3 { display: flex; align-items: center; gap: 8px; margin: 24px 0 4px; font-weight: 500; }
    h3:first-child { margin-top: 8px; }
    .hint { color: #666; font-size: 14px; margin: 0 0 12px; }
  `,
})
export class ApplicationsStepComponent {
  readonly improvements = input('');
  readonly applications = input('');
  readonly futureExperiments = input('');
  readonly showHints = input(true);
  readonly changed = output<Partial<ReportSubmission>>();
}
