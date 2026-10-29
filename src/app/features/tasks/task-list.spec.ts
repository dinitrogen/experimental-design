import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Timestamp } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { TaskSubmission } from '../../core/models/task.model';
import { AuthService } from '../../core/services/auth.service';
import { TaskAssignment, TaskService } from '../../core/services/task.service';
import { TASK_DEFINITIONS } from '../../core/tasks/task-registry';
import { TaskListComponent } from './task-list';

describe('TaskListComponent archive', () => {
  const archived = TASK_DEFINITIONS.find((task) => task.id.startsWith('task-001-'))!;
  const active = TASK_DEFINITIONS.find((task) => task.id.startsWith('task-022-'))!;
  const coach = signal(true);
  const assignments = signal<Record<string, TaskAssignment>>({});
  const submissions = signal<TaskSubmission[]>([]);
  const user = signal({ uid: 'student-1' });

  beforeEach(async () => {
    coach.set(true);
    assignments.set({});
    submissions.set([]);
    await TestBed.configureTestingModule({
      imports: [TaskListComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isCoach: coach, user } },
        {
          provide: TaskService,
          useValue: {
            assignments,
            getAllTasks: () => TASK_DEFINITIONS,
            loadAssignments: async () => {},
            getMyTaskSubmissions: async () => submissions(),
            getDueDate: () => undefined,
            isAssignedTo: (taskId: string, uid: string) => {
              const assignment = assignments()[taskId];
              return !!assignment &&
                (assignment.type === 'all' || assignment.studentUids.includes(uid));
            },
          },
        },
        { provide: MatDialog, useValue: {} },
        { provide: MatSnackBar, useValue: {} },
      ],
    }).compileComponents();
  });

  it('shows active tasks by default and lets coaches manage existing archived assignments', async () => {
    assignments.set({ [archived.id]: { type: 'all', studentUids: [] } });
    const fixture = TestBed.createComponent(TaskListComponent);
    fixture.detectChanges();
    await fixture.componentInstance.ngOnInit();
    await fixture.whenStable();
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    const toggle = [...page.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('Show archived tasks'),
    );

    expect(page.textContent).toContain(active.title);
    expect(page.textContent).not.toContain(archived.title);
    expect(toggle?.getAttribute('aria-pressed')).toBe('false');
    toggle?.click();
    fixture.detectChanges();
    expect(toggle?.getAttribute('aria-pressed')).toBe('true');
    expect(page.textContent).toContain(archived.title);
    expect(page.textContent).toContain('Assigned to All');
    expect(page.textContent).not.toContain(active.title);
    toggle?.click();
    fixture.detectChanges();
    expect(page.textContent).toContain(active.title);
    expect(page.textContent).not.toContain(archived.title);
  });

  it('keeps assigned archived tasks and completed responses visible to students', async () => {
    coach.set(false);
    assignments.set({
      [archived.id]: { type: 'individual', studentUids: ['student-1'] },
      [active.id]: { type: 'all', studentUids: [] },
    });
    submissions.set([{
      taskId: archived.id,
      studentUid: 'student-1',
      status: 'reviewed',
      responses: ['Saved answer'],
      coachFeedback: 'Well done',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      submittedAt: Timestamp.now(),
      reviewedAt: Timestamp.now(),
    }]);
    const fixture = TestBed.createComponent(TaskListComponent);
    fixture.detectChanges();
    await fixture.componentInstance.ngOnInit();
    await fixture.whenStable();
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;

    expect(page.textContent).toContain(archived.title);
    expect(page.textContent).toContain(active.title);
    expect(page.textContent).toContain('View Feedback');
    expect(page.textContent).not.toContain('Show archived tasks');
    expect(page.querySelector(`a[href="/tasks/${archived.id}"]`)).not.toBeNull();
  });
});
