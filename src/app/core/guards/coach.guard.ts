import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const coachGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoading()) {
    return new Promise<boolean>((resolve) => {
      const start = Date.now();
      const check = setInterval(() => {
        if (!authService.isLoading()) {
          clearInterval(check);
          if (authService.isCoach()) {
            resolve(true);
          } else {
            router.navigate(['/dashboard']);
            resolve(false);
          }
        } else if (Date.now() - start > 10_000) {
          clearInterval(check);
          router.navigate(['/dashboard']);
          resolve(false);
        }
      }, 50);
    });
  }

  if (authService.isCoach()) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
