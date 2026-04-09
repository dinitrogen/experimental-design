import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
  computed,
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
import { MatChipsModule } from '@angular/material/chips';
import { Subscription } from 'rxjs';
import { SubmissionService } from '../../../core/services/submission.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReportSubmission, SectionLock, REPORT_SECTION_KEYS, ReportSectionKey } from '../../../core/models/submission.model';
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
    MatChipsModule,
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
    } @else if (isAlreadySubmitted()) {
      <div class="submitted-banner">
        <mat-icon>check_circle</mat-icon>
        <div>
          <h2>Report Already Submitted</h2>
          <p>This report has been submitted for coach review and can no longer be edited.</p>
        </div>
        <a mat-raised-button [routerLink]="['/practice-events', slug()]">
          <mat-icon>arrow_back</mat-icon>
          Back to Event
        </a>
      </div>
    } @else if (submission()) {
      <div class="builder-header">
        <div class="header-left">
          <a mat-button [routerLink]="['/practice-events', slug()]">
            <mat-icon>arrow_back</mat-icon>
            Back
          </a>
          <h1>Report Builder</h1>
          @if (isTeamMode()) {
            <mat-chip-set aria-label="Team mode indicator">
              <mat-chip highlighted>
                <mat-icon matChipAvatar>group</mat-icon>
                Team Mode
              </mat-chip>
            </mat-chip-set>
          }
        </div>
        <div class="header-right">
          @if (saving()) {
            <span class="save-status">Saving...</span>
          } @else if (lastSaved()) {
            <span class="save-status saved">
              <mat-icon>check</mat-icon> Saved
            </span>
          }
          @if (!isTeamMode()) {
            <app-countdown-timer #timer [durationMinutes]="50" (expired)="onTimerExpired()" />
          }
          <button
            mat-icon-button
            class="discard-btn"
            (click)="discardReport()"
            aria-label="Discard report"
            matTooltip="Discard Report"
          >
            <mat-icon>delete</mat-icon>
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

        <mat-step>
          <ng-template matStepLabel>
            <span class="step-label-row">
              Problem Statement & Hypothesis
              @if (getStepLockIcon('problemHypothesis'); as lockIcon) {
                <mat-icon class="step-lock-icon" [class.my-lock]="lockIcon === 'lock_open'">{{ lockIcon }}</mat-icon>
              }
            </span>
          </ng-template>
          @if (isTeamMode()) {
            <div class="section-lock-bar">
              @if (isSectionLockedByMe('problemHypothesis')) {
                <button mat-stroked-button (click)="checkinSection('problemHypothesis')">
                  <mat-icon>lock_open</mat-icon> Check In Section
                </button>
              } @else if (getSectionLock('problemHypothesis'); as lock) {
                <span class="locked-badge">
                  <mat-icon>lock</mat-icon> Locked by {{ lock.lockedByName }}
                </span>
              } @else {
                <button mat-flat-button (click)="checkoutSection('problemHypothesis')">
                  <mat-icon>edit</mat-icon> Check Out Section
                </button>
              }
            </div>
          }
          <div [attr.inert]="isSectionDisabled('problemHypothesis') ? '' : null" [class.section-locked]="isSectionDisabled('problemHypothesis')">
            <app-step-problem-hypothesis
              [problemStatement]="submission()!.problemStatement"
              [hypothesis]="submission()!.hypothesis"
              [showHints]="settingsService.showHints()"
              (changed)="onFieldChange($event)"
            />
          </div>
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-flat-button matStepperNext>Next</button>
          </div>
        </mat-step>

        <mat-step>
          <ng-template matStepLabel>
            <span class="step-label-row">
              Variables
              @if (getStepLockIcon('variables'); as lockIcon) {
                <mat-icon class="step-lock-icon" [class.my-lock]="lockIcon === 'lock_open'">{{ lockIcon }}</mat-icon>
              }
            </span>
          </ng-template>
          @if (isTeamMode()) {
            <div class="section-lock-bar">
              @if (isSectionLockedByMe('variables')) {
                <button mat-stroked-button (click)="checkinSection('variables')">
                  <mat-icon>lock_open</mat-icon> Check In Section
                </button>
              } @else if (getSectionLock('variables'); as lock) {
                <span class="locked-badge">
                  <mat-icon>lock</mat-icon> Locked by {{ lock.lockedByName }}
                </span>
              } @else {
                <button mat-flat-button (click)="checkoutSection('variables')">
                  <mat-icon>edit</mat-icon> Check Out Section
                </button>
              }
            </div>
          }
          <div [attr.inert]="isSectionDisabled('variables') ? '' : null" [class.section-locked]="isSectionDisabled('variables')">
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
          </div>
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-flat-button matStepperNext>Next</button>
          </div>
        </mat-step>

        <mat-step>
          <ng-template matStepLabel>
            <span class="step-label-row">
              Materials & Procedure
              @if (getStepLockIcon('materialsProcedure'); as lockIcon) {
                <mat-icon class="step-lock-icon" [class.my-lock]="lockIcon === 'lock_open'">{{ lockIcon }}</mat-icon>
              }
            </span>
          </ng-template>
          @if (isTeamMode()) {
            <div class="section-lock-bar">
              @if (isSectionLockedByMe('materialsProcedure')) {
                <button mat-stroked-button (click)="checkinSection('materialsProcedure')">
                  <mat-icon>lock_open</mat-icon> Check In Section
                </button>
              } @else if (getSectionLock('materialsProcedure'); as lock) {
                <span class="locked-badge">
                  <mat-icon>lock</mat-icon> Locked by {{ lock.lockedByName }}
                </span>
              } @else {
                <button mat-flat-button (click)="checkoutSection('materialsProcedure')">
                  <mat-icon>edit</mat-icon> Check Out Section
                </button>
              }
            </div>
          }
          <div [attr.inert]="isSectionDisabled('materialsProcedure') ? '' : null" [class.section-locked]="isSectionDisabled('materialsProcedure')">
            <app-step-materials-procedure
              [materials]="submission()!.materials"
              [procedure]="submission()!.procedure"
              [showHints]="settingsService.showHints()"
              (changed)="onFieldChange($event)"
            />
          </div>
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-flat-button matStepperNext>Next</button>
          </div>
        </mat-step>

        <mat-step>
          <ng-template matStepLabel>
            <span class="step-label-row">
              Qualitative Observations
              @if (getStepLockIcon('observations'); as lockIcon) {
                <mat-icon class="step-lock-icon" [class.my-lock]="lockIcon === 'lock_open'">{{ lockIcon }}</mat-icon>
              }
            </span>
          </ng-template>
          @if (isTeamMode()) {
            <div class="section-lock-bar">
              @if (isSectionLockedByMe('observations')) {
                <button mat-stroked-button (click)="checkinSection('observations')">
                  <mat-icon>lock_open</mat-icon> Check In Section
                </button>
              } @else if (getSectionLock('observations'); as lock) {
                <span class="locked-badge">
                  <mat-icon>lock</mat-icon> Locked by {{ lock.lockedByName }}
                </span>
              } @else {
                <button mat-flat-button (click)="checkoutSection('observations')">
                  <mat-icon>edit</mat-icon> Check Out Section
                </button>
              }
            </div>
          }
          <div [attr.inert]="isSectionDisabled('observations') ? '' : null" [class.section-locked]="isSectionDisabled('observations')">
            <app-step-observations
              [qualitativeObsSetup]="submission()!.qualitativeObsSetup ?? ''"
              [qualitativeObsProcedure]="submission()!.qualitativeObsProcedure ?? ''"
              [qualitativeObsResults]="submission()!.qualitativeObsResults ?? ''"
              [showHints]="settingsService.showHints()"
              (changed)="onFieldChange($event)"
            />
          </div>
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-flat-button matStepperNext>Next</button>
          </div>
        </mat-step>

        <mat-step>
          <ng-template matStepLabel>
            <span class="step-label-row">
              Data Table
              @if (getStepLockIcon('dataTable'); as lockIcon) {
                <mat-icon class="step-lock-icon" [class.my-lock]="lockIcon === 'lock_open'">{{ lockIcon }}</mat-icon>
              }
            </span>
          </ng-template>
          @if (isTeamMode()) {
            <div class="section-lock-bar">
              @if (isSectionLockedByMe('dataTable')) {
                <button mat-stroked-button (click)="checkinSection('dataTable')">
                  <mat-icon>lock_open</mat-icon> Check In Section
                </button>
              } @else if (getSectionLock('dataTable'); as lock) {
                <span class="locked-badge">
                  <mat-icon>lock</mat-icon> Locked by {{ lock.lockedByName }}
                </span>
              } @else {
                <button mat-flat-button (click)="checkoutSection('dataTable')">
                  <mat-icon>edit</mat-icon> Check Out Section
                </button>
              }
            </div>
          }
          <div [attr.inert]="isSectionDisabled('dataTable') ? '' : null" [class.section-locked]="isSectionDisabled('dataTable')">
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
          </div>
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-flat-button matStepperNext>Next</button>
          </div>
        </mat-step>

        <mat-step>
          <ng-template matStepLabel>
            <span class="step-label-row">
              Graph
              @if (getStepLockIcon('graph'); as lockIcon) {
                <mat-icon class="step-lock-icon" [class.my-lock]="lockIcon === 'lock_open'">{{ lockIcon }}</mat-icon>
              }
            </span>
          </ng-template>
          @if (isTeamMode()) {
            <div class="section-lock-bar">
              @if (isSectionLockedByMe('graph')) {
                <button mat-stroked-button (click)="checkinSection('graph')">
                  <mat-icon>lock_open</mat-icon> Check In Section
                </button>
              } @else if (getSectionLock('graph'); as lock) {
                <span class="locked-badge">
                  <mat-icon>lock</mat-icon> Locked by {{ lock.lockedByName }}
                </span>
              } @else {
                <button mat-flat-button (click)="checkoutSection('graph')">
                  <mat-icon>edit</mat-icon> Check Out Section
                </button>
              }
            </div>
          }
          <div [attr.inert]="isSectionDisabled('graph') ? '' : null" [class.section-locked]="isSectionDisabled('graph')">
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
          </div>
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-flat-button matStepperNext>Next</button>
          </div>
        </mat-step>

        <mat-step>
          <ng-template matStepLabel>
            <span class="step-label-row">
              Statistics
              @if (getStepLockIcon('statistics'); as lockIcon) {
                <mat-icon class="step-lock-icon" [class.my-lock]="lockIcon === 'lock_open'">{{ lockIcon }}</mat-icon>
              }
            </span>
          </ng-template>
          @if (isTeamMode()) {
            <div class="section-lock-bar">
              @if (isSectionLockedByMe('statistics')) {
                <button mat-stroked-button (click)="checkinSection('statistics')">
                  <mat-icon>lock_open</mat-icon> Check In Section
                </button>
              } @else if (getSectionLock('statistics'); as lock) {
                <span class="locked-badge">
                  <mat-icon>lock</mat-icon> Locked by {{ lock.lockedByName }}
                </span>
              } @else {
                <button mat-flat-button (click)="checkoutSection('statistics')">
                  <mat-icon>edit</mat-icon> Check Out Section
                </button>
              }
            </div>
          }
          <div [attr.inert]="isSectionDisabled('statistics') ? '' : null" [class.section-locked]="isSectionDisabled('statistics')">
            <app-step-statistics
              [dataTable]="submission()!.dataTable"
              [numTrials]="submission()!.numTrials"
              [statisticsNotes]="submission()!.statisticsNotes"
              [manualCalculations]="submission()!.manualCalculations"
              [showHints]="settingsService.showHints()"
              [allowCheckMyWork]="settingsService.checkMyWork()"
              (changed)="onFieldChange($event)"
            />
          </div>
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-flat-button matStepperNext>Next</button>
          </div>
        </mat-step>

        <mat-step>
          <ng-template matStepLabel>
            <span class="step-label-row">
              Experimental Errors
              @if (getStepLockIcon('errors'); as lockIcon) {
                <mat-icon class="step-lock-icon" [class.my-lock]="lockIcon === 'lock_open'">{{ lockIcon }}</mat-icon>
              }
            </span>
          </ng-template>
          @if (isTeamMode()) {
            <div class="section-lock-bar">
              @if (isSectionLockedByMe('errors')) {
                <button mat-stroked-button (click)="checkinSection('errors')">
                  <mat-icon>lock_open</mat-icon> Check In Section
                </button>
              } @else if (getSectionLock('errors'); as lock) {
                <span class="locked-badge">
                  <mat-icon>lock</mat-icon> Locked by {{ lock.lockedByName }}
                </span>
              } @else {
                <button mat-flat-button (click)="checkoutSection('errors')">
                  <mat-icon>edit</mat-icon> Check Out Section
                </button>
              }
            </div>
          }
          <div [attr.inert]="isSectionDisabled('errors') ? '' : null" [class.section-locked]="isSectionDisabled('errors')">
            <app-step-errors
              [errors]="submission()!.errors"
              [showHints]="settingsService.showHints()"
              (changed)="onFieldChange($event)"
            />
          </div>
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-flat-button matStepperNext>Next</button>
          </div>
        </mat-step>

        <mat-step>
          <ng-template matStepLabel>
            <span class="step-label-row">
              CER Analysis
              @if (getStepLockIcon('cer'); as lockIcon) {
                <mat-icon class="step-lock-icon" [class.my-lock]="lockIcon === 'lock_open'">{{ lockIcon }}</mat-icon>
              }
            </span>
          </ng-template>
          @if (isTeamMode()) {
            <div class="section-lock-bar">
              @if (isSectionLockedByMe('cer')) {
                <button mat-stroked-button (click)="checkinSection('cer')">
                  <mat-icon>lock_open</mat-icon> Check In Section
                </button>
              } @else if (getSectionLock('cer'); as lock) {
                <span class="locked-badge">
                  <mat-icon>lock</mat-icon> Locked by {{ lock.lockedByName }}
                </span>
              } @else {
                <button mat-flat-button (click)="checkoutSection('cer')">
                  <mat-icon>edit</mat-icon> Check Out Section
                </button>
              }
            </div>
          }
          <div [attr.inert]="isSectionDisabled('cer') ? '' : null" [class.section-locked]="isSectionDisabled('cer')">
            <app-step-cer
              [cerTrend]="submission()!.cerTrend"
              [cerVariation]="submission()!.cerVariation"
              [cerOutliers]="submission()!.cerOutliers"
              [cerConclusion]="submission()!.cerConclusion"
              [cerConclusionHypothesisRestated]="submission()!.cerConclusionHypothesisRestated ?? ''"
              [showHints]="settingsService.showHints()"
              (changed)="onFieldChange($event)"
            />
          </div>
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-flat-button matStepperNext>Next</button>
          </div>
        </mat-step>

        <mat-step>
          <ng-template matStepLabel>
            <span class="step-label-row">
              Applications & Improvements
              @if (getStepLockIcon('applications'); as lockIcon) {
                <mat-icon class="step-lock-icon" [class.my-lock]="lockIcon === 'lock_open'">{{ lockIcon }}</mat-icon>
              }
            </span>
          </ng-template>
          @if (isTeamMode()) {
            <div class="section-lock-bar">
              @if (isSectionLockedByMe('applications')) {
                <button mat-stroked-button (click)="checkinSection('applications')">
                  <mat-icon>lock_open</mat-icon> Check In Section
                </button>
              } @else if (getSectionLock('applications'); as lock) {
                <span class="locked-badge">
                  <mat-icon>lock</mat-icon> Locked by {{ lock.lockedByName }}
                </span>
              } @else {
                <button mat-flat-button (click)="checkoutSection('applications')">
                  <mat-icon>edit</mat-icon> Check Out Section
                </button>
              }
            </div>
          }
          <div [attr.inert]="isSectionDisabled('applications') ? '' : null" [class.section-locked]="isSectionDisabled('applications')">
            <app-step-applications
              [improvements]="submission()!.improvements"
              [applications]="submission()!.applications"
              [futureExperiments]="submission()!.futureExperiments"
              [showHints]="settingsService.showHints()"
              (changed)="onFieldChange($event)"
            />
          </div>
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button
              mat-flat-button
              color="primary"
              (click)="submitReport()"
              [disabled]="submitting() || hasActiveLocks()"
            >
              <mat-icon>send</mat-icon>
              Submit Report
            </button>
            @if (hasActiveLocks()) {
              <span class="lock-warning">All sections must be checked in before submitting</span>
            }
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

    .discard-btn {
      color: #c62828;
    }

    .section-lock-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0 12px;
    }

    .locked-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 16px;
      background: #fff3e0;
      color: #e65100;
      font-size: 13px;
      font-weight: 500;
    }

    .locked-badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .section-locked {
      opacity: 0.5;
      pointer-events: none;
    }

    .lock-warning {
      font-size: 13px;
      color: #e65100;
      display: flex;
      align-items: center;
    }

    .submitted-banner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 64px 24px;
      text-align: center;
      color: #2e7d32;
    }

    .submitted-banner mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
    }

    .submitted-banner h2 {
      margin: 0;
    }

    .submitted-banner p {
      margin: 0;
      color: #666;
    }

    .step-label-row {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .step-lock-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #e65100;
    }

    .step-lock-icon.my-lock {
      color: #2e7d32;
    }
  `,
})
export class ReportBuilderComponent implements OnInit, OnDestroy {
  readonly slug = input.required<string>();

  private readonly submissionService = inject(SubmissionService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  protected readonly settingsService = inject(PracticeSettingsService);

  private timerRef: CountdownTimerComponent | undefined;
  private stepperRef: MatStepper | undefined;
  private stepperSub?: Subscription;
  private unsubSnapshot?: () => void;

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

  /** Whether this is a team (shared) submission */
  protected readonly isTeamMode = computed(() => {
    const sub = this.submission();
    return !!(sub?.teamMemberUids && sub.teamMemberUids.length > 0);
  });

  /** Whether the report has already been submitted (blocks editing in team mode) */
  protected readonly isAlreadySubmitted = computed(() => {
    const sub = this.submission();
    return !!sub && sub.status !== 'draft';
  });

  /** Current section locks map */
  protected readonly sectionLocks = computed(() => this.submission()?.sectionLocks ?? {});

  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingChanges: Partial<ReportSubmission> = {};
  private part2Warned = false;
  private readonly PART2_FIRST_STEP = 6; // Graph step index (0-based)

  async ngOnInit(): Promise<void> {
    try {
      const eventId = this.slug();

      // Try to find a team draft first, fall back to solo draft
      let draft = await this.submissionService.getTeamDraft(eventId);
      if (draft) {
        this.submission.set(draft);
        // Set up real-time listener for team mode
        this.startRealtimeSync(draft.id!);
      } else {
        draft = await this.submissionService.getOrCreateDraft(eventId);
        this.submission.set(draft);
      }
    } catch (e) {
      this.snackBar.open('Failed to load report. Please try again.', 'OK', {
        duration: 5000,
      });
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    // Release any sections we hold
    this.releaseMyLocks();

    // Persist timer state and flush any pending saves
    if (this.timerRef && !this.isTeamMode()) {
      this.pendingChanges.timerRemaining = this.timerRef.remaining();
    }
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.stepperSub?.unsubscribe();
    this.unsubSnapshot?.();
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

  // ── Team mode helpers ──────────────────────────────────────────────

  /** Get the lock for a section, or undefined if unlocked */
  protected getSectionLock(section: ReportSectionKey): SectionLock | undefined {
    return this.sectionLocks()[section];
  }

  /** Whether the current user holds the lock on a section */
  protected isSectionLockedByMe(section: ReportSectionKey): boolean {
    const uid = this.authService.user()?.uid;
    return this.sectionLocks()[section]?.lockedByUid === uid;
  }

  /** Whether a section should be non-interactive (team mode + not locked by me) */
  protected isSectionDisabled(section: ReportSectionKey): boolean {
    if (!this.isTeamMode()) return false;
    return !this.isSectionLockedByMe(section);
  }

  /** Whether any locks exist (blocks submit) */
  protected hasActiveLocks(): boolean {
    if (!this.isTeamMode()) return false;
    return Object.keys(this.sectionLocks()).length > 0;
  }

  /** Returns an icon name for the step label, or empty string if no lock / not team mode */
  protected getStepLockIcon(section: ReportSectionKey): string {
    if (!this.isTeamMode()) return '';
    const lock = this.sectionLocks()[section];
    if (!lock) return '';
    return lock.lockedByUid === this.authService.user()?.uid ? 'lock_open' : 'lock';
  }

  protected async checkoutSection(section: ReportSectionKey): Promise<void> {
    const sub = this.submission();
    if (!sub?.id) return;

    // Flush any pending saves before checkout
    await this.flushSave();

    const success = await this.submissionService.checkoutSection(sub.id, section);
    if (!success) {
      this.snackBar.open('That section is already checked out by a teammate.', 'OK', {
        duration: 3000,
      });
    }
  }

  protected async checkinSection(section: ReportSectionKey): Promise<void> {
    const sub = this.submission();
    if (!sub?.id) return;

    // Flush pending saves first so teammates see latest data
    await this.flushSave();
    await this.submissionService.checkinSection(sub.id, section);
  }

  private startRealtimeSync(submissionId: string): void {
    const myUid = this.authService.user()?.uid;
    this.unsubSnapshot = this.submissionService.listenToSubmission(submissionId, (updated) => {
      // Merge remote changes but preserve local pending changes for fields we're editing
      const current = this.submission();
      if (!current) {
        this.submission.set(updated);
        return;
      }

      // For sections we have checked out, keep our local pending data
      const merged = { ...updated };
      const lockedByMe = new Set<string>();
      for (const [key, lock] of Object.entries(updated.sectionLocks ?? {})) {
        if (lock.lockedByUid === myUid) lockedByMe.add(key);
      }

      // If we have pending changes for fields in our locked sections, keep them
      if (Object.keys(this.pendingChanges).length > 0 && lockedByMe.size > 0) {
        Object.assign(merged, this.pendingChanges);
      }

      this.submission.set(merged);
    });
  }

  /** Release all locks held by the current user (best-effort on destroy) */
  private releaseMyLocks(): void {
    const sub = this.submission();
    if (!sub?.id || !this.isTeamMode()) return;
    const myUid = this.authService.user()?.uid;
    for (const [section, lock] of Object.entries(this.sectionLocks())) {
      if (lock.lockedByUid === myUid) {
        this.submissionService.checkinSection(sub.id, section);
      }
    }
  }

  protected discardReport(): void {
    const sub = this.submission();
    if (!sub?.id) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        title: 'Discard Report',
        message: 'This will permanently delete your in-progress report and all of its data. This cannot be undone. Previously submitted reports will not be affected.',
        confirmText: 'Discard Report',
        confirmColor: 'warn',
        icon: 'delete',
      },
    });

    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) return;
      try {
        // Cancel any pending saves
        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.pendingChanges = {};

        await this.submissionService.deleteSubmission(sub.id!);
        this.snackBar.open('Report discarded.', 'OK', { duration: 3000 });
        this.router.navigate(['/practice-events']);
      } catch {
        this.snackBar.open('Failed to discard report. Please try again.', 'OK', { duration: 5000 });
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
