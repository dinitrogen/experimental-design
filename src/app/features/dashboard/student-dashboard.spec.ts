import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Timestamp } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { TaskSubmission } from '../../core/models/task.model';
import { AchievementService } from '../../core/services/achievement.service';
import { AuthService } from '../../core/services/auth.service';
import { ProgressService } from '../../core/services/progress.service';
import { ResourceService } from '../../core/services/resource.service';
import { SeasonService } from '../../core/services/season.service';
import { SubmissionService } from '../../core/services/submission.service';
import { TaskService } from '../../core/services/task.service';
import { TASK_DEFINITIONS } from '../../core/tasks/task-registry';
import { StudentDashboardComponent } from './student-dashboard';

describe('StudentDashboardComponent archived task history', () => {
  it('shows a completed archived task even after it is unassigned', async () => {
    const archived = TASK_DEFINITIONS.find((task) => task.id.startsWith('task-001-'))!;
    const now = Timestamp.now();
    const submission: TaskSubmission = {
      id: 'submission-1',
      taskId: archived.id,
      studentUid: 'student-1',
      status: 'reviewed',
      responses: ['Saved answer'],
      coachFeedback: 'Well done',
      createdAt: now,
      updatedAt: now,
      submittedAt: now,
      reviewedAt: now,
    };
    await TestBed.configureTestingModule({
      imports: [StudentDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { user: signal({ displayName: 'Student' }) } },
        {
          provide: ResourceService,
          useValue: {
            hiddenGuidesLoaded: signal(true),
            hiddenGuideIds: signal(new Set<string>()),
            getTotalCount: () => 0,
            getGuidesByCategory: () => [],
            loadHiddenGuides: async () => {},
          },
        },
        { provide: ProgressService, useValue: { getCompletedCount: async () => 0 } },
        { provide: SubmissionService, useValue: { getMySubmissions: async () => [] } },
        {
          provide: AchievementService,
          useValue: {
            recordLogin: () => {},
            getMyAchievements: async () => [],
            refreshAutoCompletions: async () => [],
          },
        },
        {
          provide: TaskService,
          useValue: {
            getMyTaskSubmissions: async () => [submission],
            loadAssignments: async () => {},
            getAssignedTasks: () => [],
          },
        },
        { provide: SeasonService, useValue: { getCurrentSeasonId: async () => null } },
        { provide: MatSnackBar, useValue: {} },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(StudentDashboardComponent);
    fixture.detectChanges();
    await fixture.componentInstance.ngOnInit();
    await fixture.whenStable();
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;

    expect(page.textContent).toContain(archived.title);
    expect(page.textContent).toContain('Reviewed');
    expect(page.querySelector(`a[href="/tasks/${archived.id}"]`)).not.toBeNull();
  });
});
