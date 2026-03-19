import { ChangeDetectionStrategy, Component, input, output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ReportSubmission } from '../../../../core/models/submission.model';

@Component({
  selector: 'app-step-variables',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule],
  template: `
    <div class="step-content">
      <h3>
        <mat-icon>tune</mat-icon>
        Independent Variable (IV)
      </h3>
      @if (showHints()) {
        <p class="hint">The one factor YOU deliberately change between trials.</p>
      }
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Independent Variable</mat-label>
        <input
          matInput
          [ngModel]="independentVar()"
          (ngModelChange)="changed.emit({ independentVar: $event })"
          [placeholder]="showHints() ? 'e.g., Canopy diameter (cm)' : ''"
        />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Tools & Operationally Defined</mat-label>
        <input
          matInput
          [ngModel]="ivOperationalDef()"
          (ngModelChange)="changed.emit({ ivOperationalDef: $event })"
          [placeholder]="showHints() ? 'e.g., Measured with a ruler from edge to edge' : ''"
        />
      </mat-form-field>

      <h4>
        <mat-icon>list</mat-icon>
        IV Levels
      </h4>
      @if (showHints()) {
        <p class="hint">Define the specific values or conditions you will test. These should be copied into your data table.</p>
      }
      @for (level of localLevels(); track $index) {
        <mat-form-field appearance="outline" class="level-field">
          <mat-label>Level {{ $index + 1 }}</mat-label>
          <input
            matInput
            [ngModel]="level"
            (ngModelChange)="updateLevel($index, $event)"
            [placeholder]="showHints() ? 'e.g., 10 cm, 20 cm, 30 cm' : ''"
          />
        </mat-form-field>
      }
      <div class="level-actions">
        <button mat-button (click)="addLevel()" [disabled]="localLevels().length >= 5">
          <mat-icon>add</mat-icon> Add Level
        </button>
        <button mat-button (click)="removeLevel()" [disabled]="localLevels().length <= 3">
          <mat-icon>remove</mat-icon> Remove Level
        </button>
      </div>

      <h3>
        <mat-icon>speed</mat-icon>
        Dependent Variable (DV)
      </h3>
      @if (showHints()) {
        <p class="hint">What you measure as a result of changing the IV.</p>
      }
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Dependent Variable</mat-label>
        <input
          matInput
          [ngModel]="dependentVar()"
          (ngModelChange)="changed.emit({ dependentVar: $event })"
          [placeholder]="showHints() ? 'e.g., Drop time (seconds)' : ''"
        />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Tools & Operationally Defined</mat-label>
        <input
          matInput
          [ngModel]="dvOperationalDef()"
          (ngModelChange)="changed.emit({ dvOperationalDef: $event })"
          [placeholder]="showHints() ? 'e.g., Timed with a stopwatch from release to ground contact' : ''"
        />
      </mat-form-field>

      <h3>
        <mat-icon>lock</mat-icon>
        Controlled Variables (CVs)
      </h3>
      @if (showHints()) {
        <p class="hint">Factors you keep the same to ensure a fair test. List at least 3.</p>
      }
      @for (cv of localCVs(); track $index) {
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Controlled Variable {{ $index + 1 }}</mat-label>
          <input
            matInput
            [ngModel]="cv"
            (ngModelChange)="updateCV($index, $event)"
            [placeholder]="showHints() ? 'e.g., String length, drop height, payload mass' : ''"
          />
        </mat-form-field>
      }

    </div>
  `,
  styles: `
    .step-content { max-width: 720px; }
    .full-width { width: 100%; }
    h3 { display: flex; align-items: center; gap: 8px; margin: 24px 0 4px; font-weight: 500; }
    h3:first-child { margin-top: 8px; }
    h4 { display: flex; align-items: center; gap: 8px; margin: 16px 0 4px; font-weight: 500; font-size: 15px; }
    .hint { color: #666; font-size: 14px; margin: 0 0 12px; }
    .level-field { width: 200px; margin-right: 8px; }
    .level-actions { display: flex; gap: 4px; margin-bottom: 8px; }
  `,
})
export class VariablesStepComponent implements OnInit {
  readonly independentVar = input('');
  readonly ivOperationalDef = input('');
  readonly dependentVar = input('');
  readonly dvOperationalDef = input('');
  readonly controlledVars = input<string[]>(['', '', '']);
  readonly ivLevels = input<string[]>(['', '', '']);
  readonly showHints = input(true);
  readonly changed = output<Partial<ReportSubmission>>();

  protected readonly localCVs = signal<string[]>(['', '', '']);
  protected readonly localLevels = signal<string[]>(['', '', '']);

  ngOnInit(): void {
    this.localCVs.set([...this.controlledVars()]);
    const levels = this.ivLevels() ?? [];
    this.localLevels.set(levels.length > 0 ? [...levels] : ['', '', '']);
  }

  protected updateCV(index: number, value: string): void {
    this.localCVs.update((cvs) => {
      const updated = [...cvs];
      updated[index] = value;
      return updated;
    });
    this.changed.emit({ controlledVars: this.localCVs() });
  }

  protected updateLevel(index: number, value: string): void {
    this.localLevels.update((levels) => {
      const updated = [...levels];
      updated[index] = value;
      return updated;
    });
    this.changed.emit({ ivLevels: this.localLevels() });
  }

  protected addLevel(): void {
    this.localLevels.update((levels) => [...levels, '']);
    this.changed.emit({ ivLevels: this.localLevels() });
  }

  protected removeLevel(): void {
    this.localLevels.update((levels) => levels.slice(0, -1));
    this.changed.emit({ ivLevels: this.localLevels() });
  }
}
