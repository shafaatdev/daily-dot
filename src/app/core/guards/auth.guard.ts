import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { JournalService } from '../services/journal.service';
import { AuthService } from '../services/auth.service';

export const authenticatedGuard: CanActivateFn = async (_route, routerState) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const journal = inject(JournalService);
  const state = await auth.whenReady();

  if (state.status === 'authenticated') {
    await journal.whenReady();
    return true;
  }

  return router.createUrlTree(['/auth/sign-in'], {
    queryParams: {
      returnUrl: routerState.url,
      ...(state.status === 'error' ? { authUnavailable: 'true' } : {}),
    },
  });
};

export const anonymousOnlyGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const state = await auth.whenReady();

  return state.status === 'authenticated'
    ? router.createUrlTree(['/'])
    : true;
};