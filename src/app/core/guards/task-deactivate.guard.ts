import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog';

export interface CanDeactivateTask {
  canDeactivate(): boolean;
}

export const taskDeactivateGuard: CanDeactivateFn<CanDeactivateTask> = (component) => {
  if (component.canDeactivate()) {
    return true;
  }

  const dialog = inject(MatDialog);
  const dialogRef = dialog.open(ConfirmDialogComponent, {
    width: '420px',
    data: {
      title: 'Leave Task?',
      message:
        'You have unsaved changes and have not submitted this task yet. Are you sure you want to leave?',
      confirmText: 'Leave',
      cancelText: 'Stay',
      confirmColor: 'warn',
      icon: 'warning',
    },
  });

  return firstValueFrom(dialogRef.afterClosed()).then((result) => !!result);
};
