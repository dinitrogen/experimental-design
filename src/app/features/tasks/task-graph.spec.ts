import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Timestamp } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { provideMarkdown } from 'ngx-markdown';
import { vi } from 'vitest';
import { createInitialTaskResponse, TaskDefinition, TaskSubmission } from '../../core/models/task.model';
import { TaskService } from '../../core/services/task.service';
import { GraphCanvasComponent } from '../../shared/components/graph-canvas';
import { TaskDetailComponent } from './task-detail';

describe('task graph precision', () => {
  it('plots exact decimal points and line endpoints using the keyboard-accessible inputs', async () => {
    const task: TaskDefinition = {
      id: 'test-graph', title: 'Graph task', dueDate: '', createdAt: '2026-01-01',
      prompts: [{
        label: 'Graph', type: 'graph',
        graphConfig: { xMin: 0, xMax: 10, yMin: 0, yMax: 10, maxPoints: 3 },
      }],
    };
    const now = Timestamp.now();
    const submission: TaskSubmission = {
      id: 'sub-1', taskId: task.id, studentUid: 'student', status: 'in-progress',
      responses: task.prompts.map(createInitialTaskResponse), coachFeedback: '',
      createdAt: now, updatedAt: now, submittedAt: null, reviewedAt: null,
    };
    const saveDraft = vi.fn(async (_id: string, _responses: string[]) => {});
    await TestBed.configureTestingModule({
      imports: [TaskDetailComponent],
      providers: [
        provideHttpClient(), provideMarkdown(), provideRouter([]),
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
        {
          provide: TaskService,
          useValue: {
            getTask: () => task, getDueDate: () => undefined, loadAssignments: async () => {},
            getOrCreateTaskSubmission: async () => submission, saveDraft,
          },
        },
      ],
    }).overrideComponent(GraphCanvasComponent, { set: { template: '' } }).compileComponents();
    const fixture = TestBed.createComponent(TaskDetailComponent);
    fixture.componentRef.setInput('taskId', task.id);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    const enter = (label: string, value: string) => {
      const field = [...page.querySelectorAll('mat-form-field')].find((item) => item.textContent?.includes(label));
      const input = field?.querySelector<HTMLInputElement>('input');
      expect(input).toBeDefined();
      input!.value = value;
      input!.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    const click = (label: string) => {
      const button = [...page.querySelectorAll('button')].find((item) => item.textContent?.trim() === label);
      expect(button).toBeDefined();
      button!.click();
      fixture.detectChanges();
    };

    enter('Exact x coordinate', '1.25');
    enter('Exact y coordinate', '2.75');
    click('Plot point');
    expect(page.textContent).toContain('1 of 3 points plotted');
    click('Draw line of best fit');
    click('Place line endpoint');
    enter('Exact x coordinate', '4.5');
    enter('Exact y coordinate', '8.5');
    click('Place line endpoint');
    expect(page.textContent).toContain('Line of best fit drawn');
    fixture.destroy();
    await Promise.resolve();
    const responses = saveDraft.mock.calls[0]?.[1];
    expect(responses).toBeDefined();
    expect(JSON.parse(responses![0])).toMatchObject({
      points: [{ x: 1.25, y: 2.75 }],
      lobfStart: { x: 1.25, y: 2.75 },
      lobfEnd: { x: 4.5, y: 8.5 },
    });
  });
});
