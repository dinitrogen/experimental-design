import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoading()) {
    // Auth state still resolving — wait briefly then re-check
    return new Promise<boolean>((resolve) => {
      const start = Date.now();
      const check = setInterval(() => {
        if (!authService.isLoading()) {
          clearInterval(check);
          if (authService.isLoggedIn()) {
            resolve(true);
          } else {
            router.navigate(['/login']);
            resolve(false);
          }
        } else if (Date.now() - start > 10_000) {
          clearInterval(check);
          router.navigate(['/login']);
          resolve(false);
        }
      }, 50);
    });
  }

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
