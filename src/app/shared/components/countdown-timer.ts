import { ChangeDetectionStrategy, Component, input, output, signal, OnDestroy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-countdown-timer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <div class="timer" [class.warning]="isWarning()" [class.danger]="isDanger()" [class.expired]="remaining() <= 0">
      <mat-icon>timer</mat-icon>
      <span class="time-display" role="timer" [attr.aria-label]="'Time remaining: ' + display()">
        {{ display() }}
      </span>
      @if (remaining() > 0) {
        @if (!running()) {
          <button mat-icon-button (click)="start()" aria-label="Start timer" matTooltip="Start">
            <mat-icon>play_arrow</mat-icon>
          </button>
        } @else {
          <button mat-icon-button (click)="pause()" aria-label="Pause timer" matTooltip="Pause">
            <mat-icon>pause</mat-icon>
          </button>
        }
        <button mat-icon-button (click)="reset()" aria-label="Reset timer" matTooltip="Reset">
          <mat-icon>restart_alt</mat-icon>
        </button>
      } @else {
        <span class="expired-label">Time's up!</span>
        <button mat-icon-button (click)="reset()" aria-label="Reset timer" matTooltip="Reset">
          <mat-icon>restart_alt</mat-icon>
        </button>
      }
    </div>
  `,
  styles: `
    .timer {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px;
      border-radius: 24px;
      background: #e3f2fd;
      color: #1565c0;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }

    .timer.warning {
      background: #fff3e0;
      color: #e65100;
    }

    .timer.danger {
      background: #ffebee;
      color: #c62828;
    }

    .timer.expired {
      background: #ffcdd2;
      color: #b71c1c;
    }

    .time-display {
      font-size: 18px;
      min-width: 56px;
    }

    .expired-label {
      font-size: 13px;
      font-weight: 600;
    }
  `,
})
export class CountdownTimerComponent implements OnDestroy {
  readonly durationMinutes = input(50);

  readonly expired = output<void>();

  readonly remaining = signal(50 * 60);
  readonly running = signal(false);
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private hasExpiredFired = false;

  protected readonly display = () => {
    const total = Math.max(0, this.remaining());
    const min = Math.floor(total / 60);
    const sec = total % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  protected readonly isWarning = () => {
    const total = this.remaining();
    return total <= 600 && total > 300; // 10-5 min
  };

  protected readonly isDanger = () => {
    const total = this.remaining();
    return total > 0 && total <= 300; // < 5 min
  };

  /** Set remaining seconds and optionally auto-start */
  initTimer(seconds: number, autoStart = false): void {
    this.remaining.set(seconds);
    this.hasExpiredFired = seconds <= 0;
    if (autoStart && seconds > 0) {
      this.start();
    }
  }

  start(): void {
    if (this.running()) return;
    if (this.remaining() <= 0) {
      this.remaining.set(this.durationMinutes() * 60);
      this.hasExpiredFired = false;
    }
    this.running.set(true);
    this.intervalId = setInterval(() => {
      this.remaining.update((r) => {
        if (r <= 1) {
          this.pause();
          if (!this.hasExpiredFired) {
            this.hasExpiredFired = true;
            this.expired.emit();
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  }

  pause(): void {
    this.running.set(false);
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  reset(): void {
    this.pause();
    this.remaining.set(this.durationMinutes() * 60);
    this.hasExpiredFired = false;
  }

  ngOnDestroy(): void {
    this.pause();
  }
}
