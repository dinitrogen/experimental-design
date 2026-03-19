import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ReportSubmission } from '../../../../core/models/submission.model';

@Component({
  selector: 'app-step-materials-procedure',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <div class="step-content">
      <h3>
        <mat-icon>inventory_2</mat-icon>
        Materials
      </h3>
      @if (showHints()) {
        <p class="hint">List all materials and equipment used, with quantities and sizes.</p>
      }
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Materials List</mat-label>
        <textarea
          matInput
          rows="6"
          [ngModel]="materials()"
          (ngModelChange)="changed.emit({ materials: $event })"
          [placeholder]="showHints() ? '- 1 trash bag (large)\n- String (60 cm)\n- Scissors\n- Stopwatch\n- Ruler (30 cm)' : ''"
        ></textarea>
        @if (showHints()) {
          <mat-hint>Use one line per item. Include specific measurements.</mat-hint>
        }
      </mat-form-field>

      <h3>
        <mat-icon>format_list_numbered</mat-icon>
        Procedure
      </h3>
      @if (showHints()) {
        <p class="hint">Write numbered step-by-step instructions that someone else could follow to repeat your experiment.</p>
      }
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Procedure</mat-label>
        <textarea
          matInput
          rows="10"
          [ngModel]="procedure()"
          (ngModelChange)="changed.emit({ procedure: $event })"
          [placeholder]="showHints() ? '1. Gather materials and set up workspace.\n2. Cut a circle from the trash bag with diameter 10 cm.\n3. Attach four equal-length strings...\n4. Drop the parachute from 2 meters...\n5. Start stopwatch when released, stop when it lands.\n6. Record the time. Repeat for 3 trials.' : ''"
        ></textarea>
        @if (showHints()) {
          <mat-hint>Include setup, measurement method, number of trials, and cleanup.</mat-hint>
        }
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
export class MaterialsProcedureStepComponent {
  readonly materials = input('');
  readonly procedure = input('');
  readonly showHints = input(true);
  readonly changed = output<Partial<ReportSubmission>>();
}
