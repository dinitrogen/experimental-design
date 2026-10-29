import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Timestamp } from '@angular/fire/firestore';
import { provideRouter } from '@angular/router';
import { TaskSubmission } from '../../core/models/task.model';
import { AchievementService } from '../../core/services/achievement.service';
import { ResourceService } from '../../core/services/resource.service';
import { SeasonService } from '../../core/services/season.service';
import { StudentService } from '../../core/services/student.service';
import { TaskService } from '../../core/services/task.service';
import { TASK_DEFINITIONS } from '../../core/tasks/task-registry';
import { StudentDetailComponent } from './student-detail';

describe('StudentDetailComponent archived task history', () => {
  it('keeps archived submissions and assignments while hiding unrelated archived tasks', async () => {
    const completed = TASK_DEFINITIONS.find((task) => task.id.startsWith('task-001-'))!;
    const assigned = TASK_DEFINITIONS.find((task) => task.id.startsWith('task-002-'))!;
    const unrelated = TASK_DEFINITIONS.find((task) => task.id.startsWith('task-003-'))!;
    const now = Timestamp.now();
    const submission: TaskSubmission = {
      taskId: completed.id,
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
      imports: [StudentDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: StudentService,
          useValue: {
            getAllStudents: async () => [{ uid: 'student-1', displayName: 'Student' }],
            getStudentSubmissions: async () => [],
            getStudentProgress: async () => [],
          },
        },
        { provide: ResourceService, useValue: {} },
        { provide: AchievementService, useValue: { getAchievementsForStudent: async () => [] } },
        { provide: SeasonService, useValue: { getCurrentSeasonId: async () => null } },
        {
          provide: TaskService,
          useValue: {
            assignments: signal({ [assigned.id]: { type: 'all', studentUids: [] } }),
            getTaskSubmissionsForStudent: async () => [submission],
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(StudentDetailComponent);
    fixture.componentRef.setInput('id', 'student-1');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;

    expect(page.textContent).toContain(completed.title);
    expect(page.textContent).toContain(assigned.title);
    expect(page.textContent).not.toContain(unrelated.title);
    const completedRow = [...page.querySelectorAll('tr')].find((row) =>
      row.textContent?.includes(completed.title),
    );
    expect(completedRow?.textContent).toContain('check_circle');
  });
});
