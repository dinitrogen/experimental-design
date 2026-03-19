import { ChangeDetectionStrategy, Component, input, output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ReportSubmission, ExperimentalError } from '../../../../core/models/submission.model';

@Component({
  selector: 'app-step-errors',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
  ],
  template: `
    <div class="step-content">
      <h3>
        <mat-icon>warning</mat-icon>
        Experimental Errors
      </h3>

      @if (showHints()) {
        <mat-card class="info-card">
          <mat-card-content>
            <p><strong>Types of experimental error:</strong></p>
            <ul>
              <li><strong>Random:</strong> Unpredictable variations (e.g., human reaction time with a stopwatch)</li>
              <li><strong>Procedural:</strong> Mistakes in following the procedure (e.g., forgot to reset the stopwatch)</li>
              <li><strong>Systematic:</strong> Consistent bias in one direction (e.g., a scale always reads 0.5 g high)</li>
            </ul>
          </mat-card-content>
        </mat-card>
      }

      @for (error of localErrors(); track $index) {
        <div class="error-block">
          <div class="error-row">
            <mat-form-field appearance="outline" class="type-field">
              <mat-label>Type</mat-label>
              <mat-select
                [ngModel]="error.type"
                (ngModelChange)="updateError($index, 'type', $event)"
              >
                <mat-option value="random">Random</mat-option>
                <mat-option value="procedural">Procedural</mat-option>
                <mat-option value="systematic">Systematic</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="detail-field">
              <mat-label>Specific Error Identified</mat-label>
              <input
                matInput
                [ngModel]="error.specificError"
                (ngModelChange)="updateError($index, 'specificError', $event)"
                [placeholder]="showHints() ? 'e.g., Stopwatch started 0.2s late on trial 3' : ''"
              />
            </mat-form-field>
          </div>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>How It Affected Results</mat-label>
            <input
              matInput
              [ngModel]="error.resultImpact"
              (ngModelChange)="updateError($index, 'resultImpact', $event)"
              [placeholder]="showHints() ? 'e.g., Made trial 3 time appear shorter than actual' : ''"
            />
          </mat-form-field>
        </div>
      }
    </div>
  `,
  styles: `
    .step-content { max-width: 720px; }
    h3 { display: flex; align-items: center; gap: 8px; margin: 8px 0 4px; font-weight: 500; }

    .info-card {
      margin: 12px 0 16px;
      background: #fff8e1;
    }

    .info-card p { margin: 0 0 8px; }
    .info-card ul { margin: 0; padding-left: 20px; }
    .info-card li { line-height: 1.6; }

    .error-block {
      margin-bottom: 12px;
      padding: 12px;
      background: #fafafa;
      border-radius: 8px;
      border-left: 3px solid #e0e0e0;
    }

    .error-row {
      display: flex;
      gap: 12px;
      margin-bottom: 4px;
    }

    .type-field { width: 160px; }
    .detail-field { flex: 1; }
    .full-width { width: 100%; }
  `,
})
export class ErrorsStepComponent implements OnInit {
  readonly errors = input<ExperimentalError[]>([]);
  readonly showHints = input(true);
  readonly changed = output<Partial<ReportSubmission>>();

  protected readonly localErrors = signal<ExperimentalError[]>([]);

  ngOnInit(): void {
    this.localErrors.set(this.errors().map((e) => ({ ...e })));
  }

  protected updateError(index: number, field: 'type' | 'specificError' | 'resultImpact', value: string): void {
    this.localErrors.update((errs) => {
      const updated = errs.map((e) => ({ ...e }));
      if (field === 'type') {
        updated[index] = { ...updated[index], type: value as ExperimentalError['type'] };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
    this.changed.emit({ errors: this.localErrors() });
  }

}
