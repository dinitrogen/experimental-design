import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ResourceService } from '../../core/services/resource.service';
import { SubmissionService } from '../../core/services/submission.service';
import { TaskService } from '../../core/services/task.service';
import { SubmissionReviewListComponent } from './submission-review-list';

describe('SubmissionReviewListComponent', () => {
  it('shows Tasks first and selects it by default', async () => {
    await TestBed.configureTestingModule({
      imports: [SubmissionReviewListComponent],
      providers: [
        provideRouter([]),
        { provide: SubmissionService, useValue: { getAllSubmitted: async () => [] } },
        { provide: TaskService, useValue: { getAllSubmittedTasks: async () => [] } },
        { provide: ResourceService, useValue: {} },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SubmissionReviewListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const tabs = [...page.querySelectorAll<HTMLElement>('[role="tab"]')];
    expect(tabs.map((tab) => tab.textContent?.trim())).toEqual(['Tasks', 'Reports']);
    expect(tabs[0]?.getAttribute('aria-selected')).toBe('true');
    fixture.destroy();
  });
});
