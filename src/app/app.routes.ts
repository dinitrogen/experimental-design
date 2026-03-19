import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { coachGuard } from './core/guards/coach.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./core/layout/shell').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/student-dashboard').then(
            (m) => m.StudentDashboardComponent
          ),
      },
      {
        path: 'study-guides',
        loadComponent: () =>
          import('./features/study-guides/study-guide-list').then(
            (m) => m.StudyGuideListComponent
          ),
      },
      {
        path: 'study-guides/:slug',
        loadComponent: () =>
          import('./features/study-guides/study-guide-detail').then(
            (m) => m.StudyGuideDetailComponent
          ),
      },
      {
        path: 'practice-events',
        loadComponent: () =>
          import('./features/practice-events/practice-event-list').then(
            (m) => m.PracticeEventListComponent
          ),
      },
      {
        path: 'practice-events/:slug',
        loadComponent: () =>
          import('./features/practice-events/event-detail').then(
            (m) => m.EventDetailComponent
          ),
      },
      {
        path: 'practice-events/:slug/report',
        loadComponent: () =>
          import('./features/practice-events/report-builder/report-builder').then(
            (m) => m.ReportBuilderComponent
          ),
      },
      {
        path: 'submissions/:id',
        loadComponent: () =>
          import('./features/dashboard/submission-view').then(
            (m) => m.SubmissionViewComponent
          ),
      },
      {
        path: 'tasks',
        loadComponent: () =>
          import('./features/tasks/task-list').then(
            (m) => m.TaskListComponent
          ),
      },
      {
        path: 'tasks/:taskId',
        loadComponent: () =>
          import('./features/tasks/task-detail').then(
            (m) => m.TaskDetailComponent
          ),
      },
      {
        path: 'team',
        loadComponent: () =>
          import('./features/team/team').then(
            (m) => m.TeamComponent
          ),
      },
      {
        path: 'coach',
        canActivate: [coachGuard],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/coach/coach-dashboard').then(
                (m) => m.CoachDashboardComponent
              ),
          },
          {
            path: 'students',
            loadComponent: () =>
              import('./features/coach/student-management').then(
                (m) => m.StudentManagementComponent
              ),
          },
          {
            path: 'students/:id',
            loadComponent: () =>
              import('./features/coach/student-detail').then(
                (m) => m.StudentDetailComponent
              ),
          },
          {
            path: 'submissions',
            loadComponent: () =>
              import('./features/coach/submission-review-list').then(
                (m) => m.SubmissionReviewListComponent
              ),
          },
          {
            path: 'submissions/:id',
            loadComponent: () =>
              import('./features/coach/submission-review-detail').then(
                (m) => m.SubmissionReviewDetailComponent
              ),
          },
          {
            path: 'tasks/:id',
            loadComponent: () =>
              import('./features/coach/task-review-detail').then(
                (m) => m.TaskReviewDetailComponent
              ),
          },
        ],
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
