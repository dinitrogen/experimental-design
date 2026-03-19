import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { StudentService } from '../../core/services/student.service';
import { TaskService, TaskAssignment } from '../../core/services/task.service';
import { TaskDefinition, TaskSubmission } from '../../core/models/task.model';
import { AppUser } from '../../core/models/user.model';
import { TaskAssignDialog } from './task-assign-dialog';

interface TaskView {
  definition: TaskDefinition;
  submission: TaskSubmission | undefined;
  status: 'not-started' | 'in-progress' | 'submitted' | 'reviewed';
  isOverdue: boolean;
  assignment: TaskAssignment | undefined;
}

@Component({
  selector: 'app-task-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  template: `
    <div class="content-container">
      <h1 class="page-title">Tasks</h1>
      @if (isCoach()) {
        <p class="page-subtitle">Manage and assign tasks to your students.</p>
      } @else {
        <p class="page-subtitle">Complete assigned tasks to practice your experimental design skills.</p>
      }

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48" />
        </div>
      } @else if (tasks().length === 0) {
        <mat-card>
          <mat-card-content class="empty-state">
            <mat-icon>assignment</mat-icon>
            @if (isCoach()) {
              <h2>No Tasks</h2>
              <p>No task definitions found.</p>
            } @else {
              <h2>No Tasks Assigned</h2>
              <p>Your coach hasn't assigned any tasks yet. Check back later!</p>
            }
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="task-list">
          @for (task of tasks(); track task.definition.id) {
            <mat-card class="task-card" [class.overdue]="!isCoach() && task.isOverdue && task.status === 'not-started'" [class.unassigned]="isCoach() && !task.assignment">
              <mat-card-content>
                @if (isCoach()) {
                  <!-- Coach view -->
                  <div class="task-icon-area">
                    @if (task.assignment) {
                      <mat-icon class="status-icon status-assigned">assignment_turned_in</mat-icon>
                    } @else {
                      <mat-icon class="status-icon status-unassigned">assignment_late</mat-icon>
                    }
                  </div>
                  <div class="task-info">
                    <div class="task-title">{{ task.definition.title }}</div>
                    <div class="task-meta">
                      <span class="due-date">Due {{ formatDate(task.definition.dueDate) }}</span>
                      @if (task.assignment) {
                        <mat-chip class="status-chip status-chip-assigned">
                          @if (task.assignment.type === 'all') {
                            Assigned to All
                          } @else {
                            Assigned to {{ task.assignment.studentUids.length }} student{{ task.assignment.studentUids.length === 1 ? '' : 's' }}
                          }
                        </mat-chip>
                      } @else {
                        <mat-chip class="status-chip status-chip-unassigned">Not Assigned</mat-chip>
                      }
                    </div>
                  </div>
                  <div class="task-action">
                    <a mat-icon-button [routerLink]="['/tasks', task.definition.id]" aria-label="View task" matTooltip="View Task">
                      <mat-icon>visibility</mat-icon>
                    </a>
                    <button mat-icon-button [matMenuTriggerFor]="assignMenu" aria-label="Assignment options">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #assignMenu="matMenu">
                      <button mat-menu-item (click)="assignToAll(task.definition)">
                        <mat-icon>group</mat-icon>
                        <span>Assign to All</span>
                      </button>
                      <button mat-menu-item (click)="assignIndividually(task.definition)">
                        <mat-icon>person_add</mat-icon>
                        <span>Assign Individually</span>
                      </button>
                      @if (task.assignment) {
                        <button mat-menu-item (click)="unassign(task.definition)">
                          <mat-icon>block</mat-icon>
                          <span>Unassign</span>
                        </button>
                      }
                    </mat-menu>
                  </div>
                } @else {
                  <!-- Student view -->
                  <div class="task-icon-area">
                    @switch (task.status) {
                      @case ('submitted') { <mat-icon class="status-icon status-submitted">check_circle</mat-icon> }
                      @case ('reviewed') { <mat-icon class="status-icon status-reviewed">grading</mat-icon> }
                      @case ('in-progress') { <mat-icon class="status-icon status-in-progress">edit_note</mat-icon> }
                      @default { <mat-icon class="status-icon status-not-started">radio_button_unchecked</mat-icon> }
                    }
                  </div>
                  <div class="task-info">
                    <div class="task-title">{{ task.definition.title }}</div>
                    <div class="task-meta">
                      <span class="due-date" [class.overdue-text]="task.isOverdue && task.status !== 'submitted' && task.status !== 'reviewed'">
                        @if (task.isOverdue && task.status !== 'submitted' && task.status !== 'reviewed') {
                          <mat-icon class="inline-icon">warning</mat-icon> Overdue
                        } @else {
                          Due {{ formatDate(task.definition.dueDate) }}
                        }
                      </span>
                      <mat-chip [class]="'status-chip status-chip-' + task.status">
                        @switch (task.status) {
                          @case ('not-started') { Not Started }
                          @case ('in-progress') { In Progress }
                          @case ('submitted') { Submitted }
                          @case ('reviewed') { Reviewed }
                        }
                      </mat-chip>
                    </div>
                  </div>
                  <div class="task-action">
                    @switch (task.status) {
                      @case ('not-started') {
                        <a mat-flat-button color="primary" [routerLink]="['/tasks', task.definition.id]">
                          Start Task
                        </a>
                      }
                      @case ('in-progress') {
                        <a mat-flat-button color="primary" [routerLink]="['/tasks', task.definition.id]">
                          Continue
                        </a>
                      }
                      @case ('submitted') {
                        <a mat-button [routerLink]="['/tasks', task.definition.id]">
                          <mat-icon>visibility</mat-icon> View
                        </a>
                      }
                      @case ('reviewed') {
                        <a mat-button [routerLink]="['/tasks', task.definition.id]">
                          <mat-icon>visibility</mat-icon> View Feedback
                        </a>
                      }
                    }
                  </div>
                }
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .page-subtitle {
      color: #666;
      margin: -8px 0 24px;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .empty-state {
      text-align: center;
      padding: 48px 16px;
      color: #666;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #bbb;
    }

    .task-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .task-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
    }

    .task-card.overdue {
      border-left: 4px solid #e65100;
    }

    .task-card.unassigned {
      opacity: 0.6;
    }

    .task-icon-area {
      flex-shrink: 0;
    }

    .status-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .status-not-started { color: #9e9e9e; }
    .status-in-progress { color: #1565c0; }
    .status-submitted { color: #2e7d32; }
    .status-reviewed { color: #6a1b9a; }
    .status-assigned { color: #2e7d32; }
    .status-unassigned { color: #9e9e9e; }

    .task-info {
      flex: 1;
      min-width: 0;
    }

    .task-title {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .task-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .due-date {
      font-size: 13px;
      color: #666;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .overdue-text {
      color: #e65100;
      font-weight: 500;
    }

    .inline-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .status-chip-not-started {
      --mdc-chip-label-text-color: #666;
    }
    .status-chip-in-progress {
      --mdc-chip-label-text-color: #1565c0;
      --mdc-chip-elevated-container-color: #e3f2fd;
    }
    .status-chip-submitted {
      --mdc-chip-label-text-color: #2e7d32;
      --mdc-chip-elevated-container-color: #e8f5e9;
    }
    .status-chip-reviewed {
      --mdc-chip-label-text-color: #6a1b9a;
      --mdc-chip-elevated-container-color: #f3e5f5;
    }
    .status-chip-assigned {
      --mdc-chip-label-text-color: #2e7d32;
      --mdc-chip-elevated-container-color: #e8f5e9;
    }
    .status-chip-unassigned {
      --mdc-chip-label-text-color: #666;
    }

    .task-action {
      flex-shrink: 0;
    }

    @media (max-width: 600px) {
      .task-card mat-card-content {
        flex-wrap: wrap;
      }
      .task-action {
        width: 100%;
      }
      .task-action a {
        width: 100%;
      }
    }
  `,
})
export class TaskListComponent implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isCoach = this.authService.isCoach;
  protected readonly loading = signal(true);
  private readonly submissions = signal<TaskSubmission[]>([]);

  protected readonly tasks = computed<TaskView[]>(() => {
    const allDefs = this.taskService.getAllTasks();
    const subs = this.submissions();
    const today = new Date().toISOString().slice(0, 10);
    const assignments = this.taskService.assignments();
    const uid = this.authService.user()?.uid;

    // Coaches see all tasks; students see only assigned tasks
    const definitions = this.isCoach()
      ? allDefs
      : allDefs.filter((def) => uid && this.taskService.isAssignedTo(def.id, uid));

    return definitions.map((def) => {
      const sub = subs.find((s) => s.taskId === def.id);
      return {
        definition: def,
        submission: sub,
        status: sub?.status ?? 'not-started',
        isOverdue: def.dueDate < today,
        assignment: assignments[def.id],
      };
    });
  });

  async ngOnInit(): Promise<void> {
    try {
      await this.taskService.loadAssignments();
      if (!this.isCoach()) {
        const subs = await this.taskService.getMyTaskSubmissions();
        this.submissions.set(subs);
      }
    } finally {
      this.loading.set(false);
    }
  }

  protected async assignToAll(task: TaskDefinition): Promise<void> {
    await this.taskService.assignToAll(task.id);
    this.snackBar.open(`"${task.title}" assigned to all students`, 'OK', { duration: 3000 });
  }

  protected async assignIndividually(task: TaskDefinition): Promise<void> {
    const assignment = this.taskService.assignments()[task.id];
    const currentUids = assignment?.type === 'individual' ? assignment.studentUids : [];

    const ref = this.dialog.open(TaskAssignDialog, {
      width: '400px',
      data: { taskTitle: task.title, currentUids },
    });

    const result = await ref.afterClosed().toPromise();
    if (result?.selectedUids) {
      await this.taskService.assignToStudents(task.id, result.selectedUids);
      this.snackBar.open(
        `"${task.title}" assigned to ${result.selectedUids.length} student${result.selectedUids.length === 1 ? '' : 's'}`,
        'OK',
        { duration: 3000 }
      );
    }
  }

  protected async unassign(task: TaskDefinition): Promise<void> {
    await this.taskService.unassignTask(task.id);
    this.snackBar.open(`"${task.title}" unassigned`, 'OK', { duration: 3000 });
  }

  protected formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
