import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Timestamp } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { provideMarkdown } from 'ngx-markdown';
import { vi } from 'vitest';
import '../../../katex-globals';
import { createInitialTaskResponse, TaskSubmission } from '../../core/models/task.model';
import { TaskService } from '../../core/services/task.service';
import { TASK_023 } from '../../core/tasks/task-023-variables-practice';
import { TaskDetailComponent } from './task-detail';

describe('variables practice', () => {
  it('renders, saves, and displays separate table responses', async () => {
    const now = Timestamp.now();
    const submission: TaskSubmission = {
      id: 'sub-1',
      taskId: TASK_023.id,
      studentUid: 'student',
      status: 'in-progress',
      responses: TASK_023.prompts.map(createInitialTaskResponse),
      coachFeedback: '',
      createdAt: now,
      updatedAt: now,
      submittedAt: null,
      reviewedAt: null,
    };
    const saveDraft = vi.fn(async (_id: string, _responses: string[]) => {});
    await TestBed.configureTestingModule({
      imports: [TaskDetailComponent],
      providers: [
        provideHttpClient(),
        provideMarkdown(),
        provideRouter([]),
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
        {
          provide: TaskService,
          useValue: {
            getTask: () => TASK_023,
            getDueDate: () => undefined,
            loadAssignments: async () => {},
            getOrCreateTaskSubmission: async () => submission,
            saveDraft,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskDetailComponent);
    fixture.componentRef.setInput('taskId', TASK_023.id);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    expect(page.textContent).toContain(
      'For each topic and materials list, come up with the variables that would make a strong experiment.',
    );
    const fields = page.querySelectorAll<HTMLTextAreaElement>('textarea.table-textarea');
    expect(fields).toHaveLength(30);
    const submit = [...page.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('Submit'),
    );
    expect(submit?.disabled).toBe(true);

    fields[0].value = 'Number of layers';
    fields[0].dispatchEvent(new Event('input'));
    fields[1].value = 'Count the layers\nbefore testing';
    fields[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(submit?.disabled).toBe(false);
    fixture.destroy();
    await Promise.resolve();
    const savedResponses = saveDraft.mock.calls[0]?.[1];
    expect(savedResponses).toBeDefined();
    expect(JSON.parse(savedResponses![0])).toEqual([['Number of layers', 'Count the layers\nbefore testing']]);

    submission.status = 'submitted';
    submission.responses = savedResponses!;
    const readOnly = TestBed.createComponent(TaskDetailComponent);
    readOnly.componentRef.setInput('taskId', TASK_023.id);
    readOnly.detectChanges();
    await readOnly.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    readOnly.detectChanges();
    const readOnlyPage: HTMLElement = readOnly.nativeElement;
    expect(readOnlyPage.querySelectorAll('textarea.table-textarea')).toHaveLength(0);
    expect(readOnlyPage.textContent).toContain('Number of layers');
    expect(readOnlyPage.textContent).toContain('Count the layers\nbefore testing');
    readOnly.destroy();
  });
});
