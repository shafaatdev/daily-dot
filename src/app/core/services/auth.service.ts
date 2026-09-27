import { DestroyRef, computed, inject, Injectable, signal } from '@angular/core';
import { Session, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from './supabase-client';

export type AuthState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; session: Session }
  | { status: 'error'; message: string };

export type AuthActionResult =
  | { status: 'success' }
  | { status: 'confirmation-required' }
  | { status: 'error'; message: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly client = inject(SUPABASE_CLIENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authState = signal<AuthState>({ status: 'loading' });
  private readonly stateListeners = new Set<(state: AuthState) => void>();
  private authEventVersion = 0;
  private initialization: Promise<void>;

  readonly state = this.authState.asReadonly();
  readonly user = computed(() => {
    const state = this.authState();
    return state.status === 'authenticated' ? state.session.user : null;
  });

  constructor() {
    if (!this.client) {
      this.setState({
        status: 'error',
        message: 'Authentication is not configured for this application.',
      });
      this.initialization = Promise.resolve();
      return;
    }

    const { data } = this.client.auth.onAuthStateChange((_event, session) => {
      this.authEventVersion += 1;
      this.setSessionState(session);
    });
    this.destroyRef.onDestroy(() => data.subscription.unsubscribe());
    this.initialization = this.loadSession();
  }

  async whenReady(): Promise<AuthState> {
    await this.initialization;
    return this.authState();
  }

  subscribeState(listener: (state: AuthState) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.authState());
    return () => this.stateListeners.delete(listener);
  }

  async retrySession(): Promise<AuthState> {
    if (!this.client) return this.authState();
    this.setState({ status: 'loading' });
    this.initialization = this.loadSession();
    await this.initialization;
    return this.authState();
  }

  async signUp(email: string, password: string): Promise<AuthActionResult> {
    if (!this.client) return this.unavailableResult();

    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) return this.failure(error.message);
      if (data.session) this.setSessionState(data.session);
      return data.session ? { status: 'success' } : { status: 'confirmation-required' };
    } catch {
      return this.failure('Sign-up could not be completed. Check your connection and try again.');
    }
  }

  async signIn(email: string, password: string): Promise<AuthActionResult> {
    if (!this.client) return this.unavailableResult();

    try {
      const { data, error } = await this.client.auth.signInWithPassword({ email, password });
      if (error) return this.failure(error.message);
      this.setSessionState(data.session);
      return { status: 'success' };
    } catch {
      return this.failure('Sign-in could not be completed. Check your connection and try again.');
    }
  }

  async signOut(): Promise<AuthActionResult> {
    if (!this.client) return this.unavailableResult();

    try {
      const { error } = await this.client.auth.signOut();
      if (error) return this.failure(error.message);
      this.setSessionState(null);
      return { status: 'success' };
    } catch {
      return this.failure('Sign-out could not be completed. Check your connection and try again.');
    }
  }

  async requestPasswordReset(email: string): Promise<AuthActionResult> {
    if (!this.client) return this.unavailableResult();

    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      return error ? this.failure(error.message) : { status: 'success' };
    } catch {
      return this.failure('The reset email could not be sent. Check your connection and try again.');
    }
  }

  async updatePassword(password: string): Promise<AuthActionResult> {
    if (!this.client) return this.unavailableResult();

    try {
      const { data, error } = await this.client.auth.updateUser({ password });
      if (error) return this.failure(error.message);
      if (data.user) {
        const { data: sessionData } = await this.client.auth.getSession();
        this.setSessionState(sessionData.session);
      }
      return { status: 'success' };
    } catch {
      return this.failure('The password could not be updated. Request a new reset link and try again.');
    }
  }

  private async loadSession(): Promise<void> {
    const eventVersion = this.authEventVersion;
    if (!this.client) return;

    try {
      const { data, error } = await this.client.auth.getSession();
      if (eventVersion !== this.authEventVersion) return;
      if (error) {
        this.setState({
          status: 'error',
          message: 'Your session could not be checked. Retry or sign in again.',
        });
        return;
      }
      this.setSessionState(data.session);
    } catch {
      if (eventVersion === this.authEventVersion) {
        this.setState({
          status: 'error',
          message: 'Your session could not be checked. Retry or sign in again.',
        });
      }
    }
  }

  private setSessionState(session: Session | null): void {
    this.setState(
      session ? { status: 'authenticated', session } : { status: 'anonymous' },
    );
  }

  private setState(state: AuthState): void {
    this.authState.set(state);
    for (const listener of this.stateListeners) listener(state);
  }

  private failure(message: string): AuthActionResult {
    return { status: 'error', message };
  }

  private unavailableResult(): AuthActionResult {
    return this.failure('Authentication is not configured for this application.');
  }
}