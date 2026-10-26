import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SESSION_ERROR_PATH, SessionStore } from './session.store';

/**
 * Guards the member subtree. Waits for the session check (GET_MY_CONFIG) to
 * finish before deciding, and sends a refused session to the error page with
 * its reason.
 */
export const authGuard: CanActivateFn = async () => {
  const session = inject(SessionStore);
  const router = inject(Router);

  await session.restore();
  if (session.isAuthenticated()) return true;

  return router.createUrlTree([SESSION_ERROR_PATH], {
    queryParams: { reason: session.failure()?.reason ?? 'invalid' },
  });
};

/** Keeps an already-authenticated member off the login screen. */
export const anonymousGuard: CanActivateFn = async () => {
  const session = inject(SessionStore);
  const router = inject(Router);

  if (!session.resolved()) await session.restore();
  return session.isAuthenticated() ? router.createUrlTree(['/member']) : true;
};
