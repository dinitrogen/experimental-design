import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ReportSubmission } from '../../../../core/models/submission.model';

@Component({
  selector: 'app-step-problem-hypothesis',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <div class="step-content">
      <h3>
        <mat-icon>help_outline</mat-icon>
        Problem Statement
      </h3>
      @if (showHints()) {
        <p class="hint">What question is your experiment trying to answer? Write it as a clear question.</p>
      }
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Problem Statement</mat-label>
        <textarea
          matInput
          rows="3"
          [ngModel]="problemStatement()"
          (ngModelChange)="changed.emit({ problemStatement: $event })"
          [placeholder]="showHints() ? 'How does [independent variable] affect [dependent variable]?' : ''"
        ></textarea>
      </mat-form-field>

      <h3>
        <mat-icon>lightbulb</mat-icon>
        Hypothesis
      </h3>
      @if (showHints()) {
        <p class="hint">
          Write a testable prediction using the "If... then... because..." format.
        </p>
      }
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Hypothesis</mat-label>
        <textarea
          matInput
          rows="4"
          [ngModel]="hypothesis()"
          (ngModelChange)="changed.emit({ hypothesis: $event })"
          [placeholder]="showHints() ? 'If [IV changes], then [DV will...], because [scientific reasoning].' : ''"
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
export class ProblemHypothesisStepComponent {
  readonly problemStatement = input('');
  readonly hypothesis = input('');
  readonly showHints = input(true);
  readonly changed = output<Partial<ReportSubmission>>();
}
