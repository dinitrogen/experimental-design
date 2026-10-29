import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog';
import type { DataGraphGuideComponent } from './data-graph-guide';

export const workspaceDeactivateGuard: CanDeactivateFn<DataGraphGuideComponent> = (component) => {
  if (component.canDeactivate()) return true;
  const ref = inject(MatDialog).open(ConfirmDialogComponent, {
    width: '420px',
    data: {
      title: 'Leave without saving?',
      message: 'Your latest workspace changes have not been saved. Leave anyway?',
      confirmText: 'Leave',
      cancelText: 'Stay',
      confirmColor: 'warn',
      icon: 'warning',
    },
  });
  return firstValueFrom(ref.afterClosed()).then((result) => result === true);
};
