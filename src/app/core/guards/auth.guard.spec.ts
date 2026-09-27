import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService, AuthState } from '../services/auth.service';
import { JournalService } from '../services/journal.service';
import { anonymousOnlyGuard, authenticatedGuard } from './auth.guard';

describe('auth guards', () => {
  let authState: AuthState;
  let router: { createUrlTree: ReturnType<typeof vi.fn> };
  let journal: { whenReady: ReturnType<typeof vi.fn> };
  let injector: Injector;

  beforeEach(() => {
    authState = { status: 'anonymous' };
    router = { createUrlTree: vi.fn((commands, options) => ({ commands, options })) };
    journal = { whenReady: vi.fn(async () => undefined) };
    injector = Injector.create({
      providers: [
        { provide: AuthService, useValue: { whenReady: vi.fn(async () => authState) } },
        { provide: Router, useValue: router },
        { provide: JournalService, useValue: journal },
      ],
    });
  });

  it('allows authenticated navigation only after journal data is ready', async () => {
    authState = signedInState();

    const result = await runInInjectionContext(injector, () =>
      authenticatedGuard({} as never, { url: '/journal' } as never),
    );

    expect(result).toBe(true);
    expect(journal.whenReady).toHaveBeenCalledOnce();
  });

  it('redirects anonymous users to sign-in with the requested path', async () => {
    const result = await runInInjectionContext(injector, () =>
      authenticatedGuard({} as never, { url: '/journal/new?mood=good' } as never),
    );

    expect(result).toEqual({
      commands: ['/auth/sign-in'],
      options: { queryParams: { returnUrl: '/journal/new?mood=good' } },
    });
  });

  it('marks session lookup failures for sign-in retry', async () => {
    authState = { status: 'error', message: 'Session unavailable' };

    const result = await runInInjectionContext(injector, () =>
      authenticatedGuard({} as never, { url: '/journal' } as never),
    );

    expect(result).toEqual({
      commands: ['/auth/sign-in'],
      options: { queryParams: { returnUrl: '/journal', authUnavailable: 'true' } },
    });
  });

  it('redirects authenticated users away from public auth forms', async () => {
    authState = signedInState();

    const result = await runInInjectionContext(injector, () => anonymousOnlyGuard({} as never, {} as never));

    expect(result).toEqual({ commands: ['/'], options: undefined });
  });
});

function signedInState(): AuthState {
  return {
    status: 'authenticated',
    session: {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: 1_900_000_000,
      user: { id: 'user-a', email: 'person@example.test' },
    } as never,
  };
}