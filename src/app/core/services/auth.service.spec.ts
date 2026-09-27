import '@angular/compiler';
import { Injector } from '@angular/core';
import { Session, SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';
import { SUPABASE_CLIENT } from './supabase-client';

describe('AuthService', () => {
  let auth: AuthService;
  let session: Session | null;
  let client: SupabaseClient;
  let signInWithPassword: ReturnType<typeof vi.fn>;
  let signUp: ReturnType<typeof vi.fn>;
  let signOut: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubGlobal('window', { location: { origin: 'https://daily-dot.test' } });
    session = null;
    signInWithPassword = vi.fn(async () => ({ data: { session: signedInSession() }, error: null }));
    signUp = vi.fn(async () => ({ data: { session: null }, error: null }));
    signOut = vi.fn(async () => ({ error: null }));
    const authApi = {
      getSession: vi.fn(async () => ({ data: { session }, error: null })),
      onAuthStateChange: vi.fn((_listener: (event: string, session: Session | null) => void) => {
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      signInWithPassword,
      signUp,
      signOut,
      resetPasswordForEmail: vi.fn(async () => ({ error: null })),
      updateUser: vi.fn(async () => ({ data: { user: { id: 'user-a' } }, error: null })),
    };
    client = { auth: authApi } as unknown as SupabaseClient;
    auth = createAuthService(client);
  });

  it('hydrates a persisted session before reporting ready', async () => {
    session = signedInSession();
    auth = createAuthService(client);
    const state = await auth.whenReady();

    expect(state.status).toBe('authenticated');
    expect(auth.user()?.id).toBe('user-a');
  });

  it('updates auth state after sign-in and sign-out', async () => {
    await auth.whenReady();
    const signedIn = await auth.signIn('person@example.test', 'correct horse battery');

    expect(signedIn.status).toBe('success');
    expect(auth.user()?.id).toBe('user-a');

    const signedOut = await auth.signOut();
    expect(signedOut.status).toBe('success');
    expect(auth.state().status).toBe('anonymous');
  });

  it('reports email confirmation when sign-up does not create an immediate session', async () => {
    await auth.whenReady();
    const result = await auth.signUp('person@example.test', 'correct horse battery');

    expect(result.status).toBe('confirmation-required');
    expect(auth.state().status).toBe('anonymous');
  });

  it('distinguishes session lookup failure from an anonymous session', async () => {
    const getSession = client.auth.getSession as ReturnType<typeof vi.fn>;
    getSession.mockRejectedValueOnce(new Error('network unavailable'));
    auth = createAuthService(client);
    const state = await auth.whenReady();

    expect(state.status).toBe('error');
  });
});

function signedInSession(): Session {
  return {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: 1_900_000_000,
    user: { id: 'user-a', email: 'person@example.test' },
  } as unknown as Session;
}

function createAuthService(client: SupabaseClient): AuthService {
  const injector = Injector.create({
    providers: [AuthService, { provide: SUPABASE_CLIENT, useValue: client }],
  });
  return injector.get(AuthService);
}