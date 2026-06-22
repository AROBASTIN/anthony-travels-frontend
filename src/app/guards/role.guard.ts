import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const expectedRoles = route.data['roles'] as Array<string>;
  const currentUser = authService.currentUser();

  if (expectedRoles && expectedRoles.length > 0) {
    if (currentUser && expectedRoles.includes(currentUser.role)) {
      return true;
    }
    // Redirect to home if they don't have the required role
    return router.createUrlTree(['/']);
  }

  return true;
};
