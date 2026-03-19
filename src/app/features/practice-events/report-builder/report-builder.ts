import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
  OnInit,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { SubmissionService } from '../../../core/services/submission.service';
import { ReportSubmission } from '../../../core/models/submission.model';
import { PracticeSettingsService } from '../../../core/services/practice-settings.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog';
import { PracticeSettingsDialogComponent } from '../../../shared/components/practice-settings-dialog';
import { CountdownTimerComponent } from '../../../shared/components/countdown-timer';
import { PromptStepComponent } from './steps/prompt';
import { ProblemHypothesisStepComponent } from './steps/problem-hypothesis';
import { VariablesStepComponent } from './steps/variables';
import { MaterialsProcedureStepComponent } from './steps/materials-procedure';
import { DataTableStepComponent } from './steps/data-table';
import { ObservationsStepComponent } from './steps/observations';
import { GraphStepComponent } from './steps/graph';
import { StatisticsStepComponent } from './steps/statistics';
import { ErrorsStepComponent } from './steps/errors';
import { CerStepComponent } from './steps/cer';
import { ApplicationsStepComponent } from './steps/applications';

@Component({
  selector: 'app-report-builder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    CountdownTimerComponent,
    PromptStepComponent,
    ProblemHypothesisStepComponent,
    VariablesStepComponent,
    MaterialsProcedureStepComponent,
    DataTableStepComponent,
    ObservationsStepComponent,
    GraphStepComponent,
    StatisticsStepComponent,
    ErrorsStepComponent,
    CerStepComponent,
    ApplicationsStepComponent,
  ],
  template: `
    @if (loading()) {
      <div class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading your report...</p>
      </div>
    } @else if (submission()) {
      <div class="builder-header">
        <div class="header-left">
          <a mat-button [routerLink]="['/practice-events', slug()]">
            <mat-icon>arrow_back</mat-icon>
            Back
          </a>
          <h1>Report Builder</h1>
        </div>
        <div class="header-right">
          @if (saving()) {
            <span class="save-status">Saving...</span>
          } @else if (lastSaved()) {
            <span class="save-status saved">
              <mat-icon>check</mat-icon> Saved
            </span>
          }
          <app-countdown-timer #timer [durationMinutes]="50" (expired)="onTimerExpired()" />
          <button
            mat-icon-button
            (click)="clearForm()"
            aria-label="Clear form and start over"
            matTooltip="Clear Form"
          >
            <mat-icon>restart_alt</mat-icon>
          </button>
          <button
            mat-icon-button
            (click)="openSettings()"
            aria-label="Practice settings"
            matTooltip="Settings"
          >
            <mat-icon>settings</mat-icon>
          </button>
        </div>
      </div>

      <mat-stepper orientation="vertical" linear="false" #stepper>
        <mat-step label="Event Prompt">
          <app-step-prompt [practiceEventId]="slug()" />
          <div class="step-actions">
            <button mat-flat-button matStepperNext>Begin Report</button>
          </div>
        </mat-step>

        <mat-step label="Problem Statement & Hypothesis">
          <app-step-problem-hypothesis
            [problemStatement]="submission()!.problemStatement"
            [hypothesis]="submission()!.hypothesis"
            [showHints]="settingsService.showHints()"
            (changed)="onFieldChange($event)"
          />
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-flat-button matStepperNext>Next</button>
          </div>
        </mat-step>

        <mat-step label="Variables">
          <app-step-variables
            [independentVar]="submission()!.independentVar"
            [ivOperationalDef]="submission()!.ivOperationalDef ?? ''"
            [dependentVar]="submission()!.dependentVar"
            [dvOperationalDef]="submission()!.dvOperationalDef ?? ''"
            [controlledVars]="submission()!.controlledVars"
            [ivLevels]="submission()!.ivLevels"
            [showHints]="settingsService.showHints()"
            (changed)="onFieldChange($event)"
          />
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-flat-button matStepperNext>Next</button>
          </div>
        </mat-step>

        <mat-step label="Materials & Procedure">
          <app-step-materials-procedure
            [materials]="submission()!.materials"
            [procedure]="submission()!.procedure"
            [showHints]="settingsService.showHints()"
            (changed)="onFieldChange($event)"
          />
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-flat-button matStepperNext>Next</button>
          </div>
        </mat-step>

        <mat-step label="Qualitative Observations">
          <app-step-observations
            [qualitativeObsSetup]="submission()!.qualitativeObsSetup ?? ''"
            [qualitativeObsProcedure]="submission()!.qualitativeObsProcedure ?? ''"
            [qualitativeObsResults]="submission()!.qualitativeObsResults ?? ''"
            [showHints]="settingsService.showHints()"
            (changed)="onFieldChange($event)"
          />
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-flat-button matStepperNext>Next</button>
          </div>
        </mat-step>

        <mat-step label="Data Table">
          <app-step-data-table
            [dataTable]="submission()!.dataTable"
            [numTrials]="submission()!.numTrials"
            [independentVar]="submission()!.independentVar"
            [dependentVar]="submission()!.dependentVar"
            [hypothesis]="submission()!.hypothesis"
            [procedure]="submission()!.procedure"
            [controlledVars]="submission()!.controlledVars"
            [dataTableIvHeader]="submission()!.dataTableIvHeader"
            [dataTableDvHeader]="submission()!.dataTableDvHeader"
            [showHints]="settingsService.showHints()"
            [allowCheckMyWork]="settingsService.checkMyWork()"
            (changed)="onFieldChange($event)"
          />
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-flat-button matStepperNext>Next</button>
          </div>
        </mat-step>

        <mat-step label="Graph">
          <app-step-graph
            [graphData]="submission()!.graphData"
            [dataTable]="submission()!.dataTable"
            [independentVar]="submission()!.independentVar"
            [dependentVar]="submission()!.dependentVar"
            [showHints]="settingsService.showHints()"
            [manualCalculations]="submission()!.manualCalculations"
            [allowCheckMyWork]="settingsService.checkMyWork()"
            (changed)="onFieldChange($event)"
          />
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-flat-button matStepperNext>Next</button>
          </div>
        </mat-step>

        <mat-step label="Statistics">
          <app-step-statistics
            [dataTable]="submission()!.dataTable"
            [numTrials]="submission()!.numTrials"
            [statisticsNotes]="submission()!.statisticsNotes"
            [manualCalculations]="submission()!.manualCalculations"
            [showHints]="settingsService.showHints()"
            [allowCheckMyWork]="settingsService.checkMyWork()"
            (changed)="onFieldChange($event)"
          />
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-flat-button matStepperNext>Next</button>
          </div>
        </mat-step>

        <mat-step label="Experimental Errors">
          <app-step-errors
            [errors]="submission()!.errors"
            [showHints]="settingsService.showHints()"
            (changed)="onFieldChange($event)"
          />
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-flat-button matStepperNext>Next</button>
          </div>
        </mat-step>

        <mat-step label="CER Analysis">
          <app-step-cer
            [cerTrend]="submission()!.cerTrend"
            [cerVariation]="submission()!.cerVariation"
            [cerOutliers]="submission()!.cerOutliers"
            [cerConclusion]="submission()!.cerConclusion"
            [cerConclusionHypothesisRestated]="submission()!.cerConclusionHypothesisRestated ?? ''"
            [showHints]="settingsService.showHints()"
            (changed)="onFieldChange($event)"
          />
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-flat-button matStepperNext>Next</button>
          </div>
        </mat-step>

        <mat-step label="Applications & Improvements">
          <app-step-applications
            [improvements]="submission()!.improvements"
            [applications]="submission()!.applications"
            [futureExperiments]="submission()!.futureExperiments"
            [showHints]="settingsService.showHints()"
            (changed)="onFieldChange($event)"
          />
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button
              mat-flat-button
              color="primary"
              (click)="submitReport()"
              [disabled]="submitting()"
            >
              <mat-icon>send</mat-icon>
              Submit Report
            </button>
          </div>
        </mat-step>
      </mat-stepper>
    }
  `,
  styles: `
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      gap: 16px;
      color: #666;
    }

    .builder-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
      background: white;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-left h1 {
      font-size: 20px;
      font-weight: 400;
      margin: 0;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .save-status {
      font-size: 13px;
      color: #888;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .save-status.saved {
      color: #2e7d32;
    }

    .save-status mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    mat-stepper {
      padding: 16px 24px;
    }

    .step-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }
  `,
})
export class ReportBuilderComponent implements OnInit, OnDestroy {
  readonly slug = input.required<string>();

  private readonly submissionService = inject(SubmissionService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  protected readonly settingsService = inject(PracticeSettingsService);

  private timerRef: CountdownTimerComponent | undefined;
  private stepperRef: MatStepper | undefined;
  private stepperSub?: Subscription;

  @ViewChild('timer') set timerSetter(ref: CountdownTimerComponent) {
    if (ref && !this.timerRef) {
      this.timerRef = ref;
      const saved = this.submission()?.timerRemaining;
      if (saved != null && saved >= 0) {
        ref.initTimer(saved, saved > 0);
      } else {
        ref.initTimer(50 * 60, true);
      }
    } else {
      this.timerRef = ref;
    }
  }

  @ViewChild('stepper') set stepperSetter(ref: MatStepper) {
    if (ref && !this.stepperRef) {
      this.stepperRef = ref;
      this.stepperSub = ref.selectionChange.subscribe((event) => {
        this.onStepChange(event.selectedIndex);
      });
    } else {
      this.stepperRef = ref;
    }
  }

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly lastSaved = signal(false);
  protected readonly submitting = signal(false);
  protected readonly submission = signal<ReportSubmission | null>(null);

  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingChanges: Partial<ReportSubmission> = {};
  private part2Warned = false;
  private readonly PART2_FIRST_STEP = 6; // Graph step index (0-based)

  async ngOnInit(): Promise<void> {
    try {
      const eventId = this.slug();
      const draft = await this.submissionService.getOrCreateDraft(eventId);
      this.submission.set(draft);

    } catch (e) {
      this.snackBar.open('Failed to load report. Please try again.', 'OK', {
        duration: 5000,
      });
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    // Persist timer state and flush any pending saves
    if (this.timerRef) {
      this.pendingChanges.timerRemaining = this.timerRef.remaining();
    }
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.stepperSub?.unsubscribe();
    this.flushSave();
  }

  protected onFieldChange(changes: Partial<ReportSubmission>): void {
    // Merge into the local submission signal
    this.submission.update((s) => (s ? { ...s, ...changes } : s));

    // Accumulate pending changes for debounced save
    Object.assign(this.pendingChanges, changes);
    this.scheduleSave();
  }

  private scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.flushSave(), 2000);
  }

  private async flushSave(): Promise<void> {
    const sub = this.submission();
    if (!sub?.id || Object.keys(this.pendingChanges).length === 0) return;

    // Always persist timer state with each save
    if (this.timerRef) {
      this.pendingChanges.timerRemaining = this.timerRef.remaining();
    }

    this.saving.set(true);
    this.lastSaved.set(false);

    try {
      await this.submissionService.saveDraft(sub.id, this.pendingChanges);
      this.pendingChanges = {};
      this.lastSaved.set(true);
    } catch {
      this.snackBar.open('Auto-save failed. Your work may not be saved.', 'OK', {
        duration: 3000,
      });
    } finally {
      this.saving.set(false);
    }
  }

  protected onTimerExpired(): void {
    this.snackBar.open('⏰ Time\'s up! You have used all 50 minutes.', 'OK', {
      duration: 10000,
    });
    // Persist timer at 0
    this.pendingChanges.timerRemaining = 0;
    this.scheduleSave();
  }

  private onStepChange(selectedIndex: number): void {
    if (this.part2Warned) return;
    if (selectedIndex < this.PART2_FIRST_STEP) return;

    const elapsed = (this.timerRef?.durationMinutes() ?? 50) * 60 - (this.timerRef?.remaining() ?? 0);
    if (elapsed < 20 * 60) {
      this.part2Warned = true;
      this.dialog.open(ConfirmDialogComponent, {
        width: '440px',
        data: {
          title: 'Moving to Part 2 Early',
          message: `You've only used ${Math.floor(elapsed / 60)} of the recommended 20 minutes for Part 1. In competition, you cannot proceed to Part 2 until 20 minutes have passed. Do you want to continue anyway?`,
          confirmText: 'Continue Anyway',
          confirmColor: 'primary',
          icon: 'warning',
        },
      });
    }
  }

  protected openSettings(): void {
    this.dialog.open(PracticeSettingsDialogComponent, { width: '400px' });
  }

  protected clearForm(): void {
    const sub = this.submission();
    if (!sub?.id) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        title: 'Clear Form',
        message: 'This will erase all your current work and reset the report to a blank form. This cannot be undone. Previously submitted reports will not be affected.',
        confirmText: 'Clear Form',
        confirmColor: 'warn',
        icon: 'restart_alt',
      },
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) return;
      try {
        // Cancel any pending saves
        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.pendingChanges = {};

        const reset = await this.submissionService.resetDraft(sub.id!, this.slug());
        this.submission.set(reset);
        this.stepperRef?.reset();
        this.snackBar.open('Form cleared. You can start fresh!', 'OK', { duration: 3000 });
      } catch {
        this.snackBar.open('Failed to clear form. Please try again.', 'OK', { duration: 5000 });
      }
    });
  }

  protected submitReport(): void {
    const sub = this.submission();
    if (!sub?.id) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        title: 'Submit Report',
        message: 'Are you sure you want to submit this report for coach review? You will not be able to edit it after submission.',
        confirmText: 'Submit Report',
        confirmColor: 'primary',
        icon: 'send',
      },
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) return;
      this.submitting.set(true);
      try {
        await this.flushSave();
        await this.submissionService.submit(sub.id!);
        this.snackBar.open('Report submitted successfully!', 'OK', { duration: 3000 });
        this.router.navigate(['/practice-events']);
      } catch {
        this.snackBar.open('Failed to submit report. Please try again.', 'OK', { duration: 5000 });
      } finally {
        this.submitting.set(false);
      }
    });
  }
}
