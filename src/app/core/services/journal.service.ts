import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import {
  DeleteJournalResult,
  JournalDraft,
  JournalEntry,
  SaveJournalResult,
} from '../models/journal-entry';
import { AuthService, AuthState } from './auth.service';
import { SUPABASE_CLIENT } from './supabase-client';

interface JournalRow {
  id: string;
  user_id: string;
  entry_date: string;
  title: string;
  content: string;
  mood: JournalEntry['mood'];
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class JournalService {
  private readonly supabaseClient = inject(SUPABASE_CLIENT);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly storedEntries = signal<JournalEntry[]>([]);
  private activeUserId: string | null = null;
  private loadGeneration = 0;
  private loadPromise: Promise<void> = Promise.resolve();
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly entries = computed(() => {
    const authState = this.auth.state();
    return authState.status === 'authenticated' && authState.session.user.id === this.activeUserId
      ? this.storedEntries()
      : [];
  });
  constructor() {
    const unsubscribe = this.auth.subscribeState((authState) => this.handleAuthState(authState));
    this.destroyRef.onDestroy(unsubscribe);
  }

  async whenReady(): Promise<void> {
    this.handleAuthState(await this.auth.whenReady());
    await this.loadPromise;
  }

  getById(id: string): JournalEntry | undefined {
    return this.entries().find((entry) => entry.id === id);
  }

  findByDate(date: string): JournalEntry | undefined {
    return this.entries().find((entry) => entry.date === date);
  }

  async save(draft: JournalDraft, id?: string): Promise<SaveJournalResult> {
    const authState = await this.auth.whenReady();
    this.handleAuthState(authState);
    if (authState.status !== 'authenticated') {
      return { status: 'error', message: 'Sign in to save journal entries.' };
    }

    const userId = authState.session.user.id;
    await this.loadPromise;
    if (this.activeUserId !== userId || !this.supabaseClient) {
      return { status: 'error', message: 'Your account changed. Reload the journal and try again.' };
    }

    const existing = id ? this.getById(id) : undefined;
    if (id && !existing) {
      return { status: 'error', message: 'This journal entry is no longer available.' };
    }
    const duplicate = this.findByDate(draft.date);
    if (duplicate && duplicate.id !== existing?.id) {
      return { status: 'duplicate', entry: duplicate };
    }

    const now = Date.now();
    const previousUpdatedAt = existing ? Date.parse(existing.updatedAt) : Number.NaN;
    const updatedAt = new Date(
      Math.max(now, Number.isFinite(previousUpdatedAt) ? previousUpdatedAt + 1 : now),
    ).toISOString();
    const payload = {
      id: existing?.id ?? crypto.randomUUID(),
      user_id: userId,
      entry_date: draft.date,
      title: draft.title,
      content: draft.content,
      mood: draft.mood,
      created_at: existing?.createdAt ?? updatedAt,
      updated_at: updatedAt,
    };

    try {
      const response = existing
        ? await this.supabaseClient.from('journal_entries')
            .update(payload)
            .eq('id', existing.id)
            .eq('user_id', userId)
            .select('*')
            .single()
        : await this.supabaseClient.from('journal_entries')
            .insert(payload)
            .select('*')
            .single();

      if (response.error) {
        return response.error.code === '23505'
          ? this.findRemoteDuplicate(draft.date, userId)
          : { status: 'error', message: 'Your entry could not be saved. Check your connection and try again.' };
      }
      if (!this.isCurrentUser(userId)) {
        return { status: 'error', message: 'Your account changed while saving. Reload the journal.' };
      }

      const savedEntry = mapJournalRow(response.data as JournalRow);
      this.storedEntries.update((currentEntries) => existing
        ? currentEntries.map((current) => current.id === existing.id ? savedEntry : current)
        : [...currentEntries, savedEntry]);
      return { status: 'saved', entry: savedEntry };
    } catch {
      return { status: 'error', message: 'Your entry could not be saved. Check your connection and try again.' };
    }
  }

  async delete(id: string): Promise<DeleteJournalResult> {
    const authState = await this.auth.whenReady();
    this.handleAuthState(authState);
    if (authState.status !== 'authenticated') {
      return { status: 'error', message: 'Sign in to delete journal entries.' };
    }

    const userId = authState.session.user.id;
    await this.loadPromise;
    if (this.activeUserId !== userId || !this.supabaseClient) {
      return { status: 'error', message: 'Your account changed. Reload the journal and try again.' };
    }
    if (!this.getById(id)) return { status: 'not-found' };

    try {
      const { data, error } = await this.supabaseClient.from('journal_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .select('id')
        .maybeSingle();
      if (error) {
        return { status: 'error', message: 'Your entry could not be deleted. Check your connection and try again.' };
      }
      if (!data) return { status: 'not-found' };

      if (this.isCurrentUser(userId)) {
        this.storedEntries.update((currentEntries) => currentEntries.filter((entry) => entry.id !== id));
      }
      return { status: 'deleted' };
    } catch {
      return { status: 'error', message: 'Your entry could not be deleted. Check your connection and try again.' };
    }
  }

  async retryLoad(): Promise<void> {
    const userId = this.activeUserId;
    if (!userId || !this.supabaseClient) return;
    const generation = ++this.loadGeneration;
    this.loading.set(true);
    this.error.set(null);
    this.loadPromise = this.loadEntries(userId, generation);
    await this.loadPromise;
  }

  private handleAuthState(authState: AuthState): void {
    if (authState.status === 'authenticated') {
      this.activateUser(authState.session.user.id);
      return;
    }

    this.loadGeneration += 1;
    this.activeUserId = null;
    this.storedEntries.set([]);
    this.loading.set(authState.status === 'loading');
    this.error.set(authState.status === 'error' ? authState.message : null);
  }

  private activateUser(userId: string): void {
    if (this.activeUserId === userId) return;

    this.activeUserId = userId;
    const generation = ++this.loadGeneration;
    this.storedEntries.set([]);
    this.loading.set(true);
    this.error.set(null);
    this.loadPromise = this.loadEntries(userId, generation);
  }

  private async loadEntries(userId: string, generation: number): Promise<void> {
    if (!this.supabaseClient) {
      this.storedEntries.set([]);
      this.loading.set(false);
      this.error.set('Journal storage is not configured.');
      return;
    }

    try {
      const { data, error } = await this.supabaseClient.from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('entry_date', { ascending: false })
        .order('updated_at', { ascending: false });
      if (error) throw error;
      if (this.isCurrentRequest(userId, generation)) {
        this.storedEntries.set((data ?? []).map((row) => mapJournalRow(row as JournalRow)));
      }
    } catch {
      if (this.isCurrentRequest(userId, generation)) {
        this.error.set('Journal entries could not be loaded. Check your connection and retry.');
      }
    } finally {
      if (this.isCurrentRequest(userId, generation)) this.loading.set(false);
    }
  }

  private async findRemoteDuplicate(date: string, userId: string): Promise<SaveJournalResult> {
    if (!this.supabaseClient) {
      return { status: 'error', message: 'Your entry could not be saved. Check your connection and try again.' };
    }

    try {
      const { data, error } = await this.supabaseClient.from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('entry_date', date)
        .maybeSingle();
      if (error || !data) {
        return { status: 'error', message: 'An entry already exists for that date. Reload your journal and try again.' };
      }
      if (!this.isCurrentUser(userId)) {
        return { status: 'error', message: 'Your account changed while saving. Reload the journal.' };
      }
      return { status: 'duplicate', entry: mapJournalRow(data as JournalRow) };
    } catch {
      return { status: 'error', message: 'An entry already exists for that date. Reload your journal and try again.' };
    }
  }

  private isCurrentRequest(userId: string, generation: number): boolean {
    return this.activeUserId === userId && this.loadGeneration === generation;
  }

  private isCurrentUser(userId: string): boolean {
    const authState = this.auth.state();
    return this.activeUserId === userId &&
      authState.status === 'authenticated' &&
      authState.session.user.id === userId;
  }
}

function mapJournalRow(row: JournalRow): JournalEntry {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.entry_date,
    title: row.title,
    content: row.content,
    mood: row.mood,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

