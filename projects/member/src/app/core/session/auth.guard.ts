import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessionStore } from './session.store';

/**
 * Guards the member subtree. Waits for session restore to finish before
 * deciding — resolving eagerly is what makes a valid session flash the login
 * screen on reload.
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  const session = inject(SessionStore);
  const router = inject(Router);

  if (!session.resolved()) await session.restore();
  if (session.isAuthenticated()) return true;

  session.captureRedirect(state.url);
  return router.createUrlTree(['/login']);
};

/** Keeps an already-authenticated member off the login screen. */
export const anonymousGuard: CanActivateFn = async () => {
  const session = inject(SessionStore);
  const router = inject(Router);

  if (!session.resolved()) await session.restore();
  return session.isAuthenticated() ? router.createUrlTree(['/member']) : true;
};
