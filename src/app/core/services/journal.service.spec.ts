import '@angular/compiler';
import { Injector, signal, WritableSignal } from '@angular/core';
import { Session, SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JournalDraft, JournalEntry } from '../models/journal-entry';
import { AuthService, AuthState } from './auth.service';
import { JournalService } from './journal.service';
import { SUPABASE_CLIENT } from './supabase-client';

const USER_A = 'user-a';
const USER_B = 'user-b';

interface TestRow {
  id: string;
  user_id: string;
  entry_date: string;
  title: string;
  content: string;
  mood: JournalEntry['mood'];
  created_at: string;
  updated_at: string;
}

describe('JournalService', () => {
  let rows: TestRow[];
  let authState: WritableSignal<AuthState>;
  let journal: JournalService;
  let injector: Injector;

  beforeEach(() => {
    rows = [];
    authState = signal<AuthState>(authenticatedState(USER_A));
    const authMock = {
      state: authState.asReadonly(),
      whenReady: vi.fn(async () => authState()),
      subscribeState: (listener: (state: AuthState) => void) => {
        listener(authState());
        return () => undefined;
      },
    };

    injector = Injector.create({
      providers: [
        JournalService,
        { provide: AuthService, useValue: authMock },
        { provide: SUPABASE_CLIENT, useValue: createClient(rows) },
      ],
    });
    journal = injector.get(JournalService);
  });

  it('loads only rows owned by the authenticated user', async () => {
    rows.push(row('entry-a', USER_A, '2026-03-10'), row('entry-b', USER_B, '2026-03-09'));
    await journal.retryLoad();

    expect(journal.entries().map((entry) => entry.id)).toEqual(['entry-a']);
  });

  it('persists entries with authenticated ownership and a date-only value', async () => {
    const result = await journal.save(draft('2026-03-10'));

    expect(result.status).toBe('saved');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.user_id).toBe(USER_A);
    expect(rows[0]?.entry_date).toBe('2026-03-10');
  });

  it('rejects a second entry for a date already used by this user', async () => {
    await journal.save(draft('2026-03-10'));
    const duplicate = await journal.save({ ...draft('2026-03-10'), title: 'Another note' });

    expect(duplicate.status).toBe('duplicate');
    expect(rows).toHaveLength(1);
  });

  it('allows the same date for another user and clears the previous cache', async () => {
    await journal.save(draft('2026-03-10'));
    authState.set(authenticatedState(USER_B));
    await journal.whenReady();

    const result = await journal.save(draft('2026-03-10'));

    expect(result.status).toBe('saved');
    expect(rows.map((entry) => entry.user_id)).toEqual([USER_A, USER_B]);
    expect(journal.entries().map((entry) => entry.userId)).toEqual([USER_B]);
  });

  it('preserves creation time when editing', async () => {
    const created = await journal.save(draft('2026-03-10'));
    expect(created.status).toBe('saved');
    if (created.status !== 'saved') return;

    const updated = await journal.save({ ...draft('2026-03-10'), title: 'Revised' }, created.entry.id);

    expect(updated.status).toBe('saved');
    if (updated.status === 'saved') {
      expect(updated.entry.createdAt).toBe(created.entry.createdAt);
      expect(updated.entry.title).toBe('Revised');
    }
  });

  it('deletes only after the remote row is deleted', async () => {
    const created = await journal.save(draft('2026-03-10'));
    expect(created.status).toBe('saved');
    if (created.status !== 'saved') return;

    const result = await journal.delete(created.entry.id);

    expect(result.status).toBe('deleted');
    expect(rows).toEqual([]);
    expect(journal.entries()).toEqual([]);
  });

  it('does not expose or write journal data while anonymous', async () => {
    authState.set({ status: 'anonymous' });
    await journal.whenReady();

    const result = await journal.save(draft('2026-03-10'));

    expect(journal.entries()).toEqual([]);
    expect(result.status).toBe('error');
    expect(rows).toEqual([]);
  });
});

function authenticatedState(userId: string): AuthState {
  const session = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: 1_900_000_000,
    user: { id: userId, email: `${userId}@example.test` },
  } as unknown as Session;
  return { status: 'authenticated', session };
}

function draft(date: string): JournalDraft {
  return { date, title: 'A day kept', content: 'A few honest lines.', mood: 'good' };
}

function row(id: string, userId: string, date: string): TestRow {
  const timestamp = `${date}T09:00:00.000Z`;
  return {
    id,
    user_id: userId,
    entry_date: date,
    title: 'A day kept',
    content: 'A few honest lines.',
    mood: 'good',
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function createClient(database: TestRow[]): SupabaseClient {
  return {
    from: () => ({
      select: () => new Query(database, 'select'),
      insert: (payload: unknown) => new Query(database, 'insert', payload),
      update: (payload: unknown) => new Query(database, 'update', payload),
      delete: () => new Query(database, 'delete'),
    }),
  } as unknown as SupabaseClient;
}

type QueryAction = 'select' | 'insert' | 'update' | 'delete';
type QueryResult = {
  data: TestRow | TestRow[] | { id: string } | null;
  error: { code: string } | null;
};

class Query {
  private readonly filters = new Map<string, string>();
  private singleResult = false;

  constructor(
    private readonly database: TestRow[],
    private readonly action: QueryAction,
    private readonly payload?: unknown,
  ) {}

  select(): this { return this; }
  order(): this { return this; }
  eq(field: string, value: string): this {
    this.filters.set(field, value);
    return this;
  }
  single(): Promise<QueryResult> {
    this.singleResult = true;
    return Promise.resolve(this.execute());
  }
  maybeSingle(): Promise<QueryResult> {
    this.singleResult = true;
    return Promise.resolve(this.execute());
  }
  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }

  private execute(): QueryResult {
    if (this.action === 'insert') return this.insertRow();
    const index = this.database.findIndex((entry) => this.matches(entry));
    if (this.action === 'delete') {
      if (index < 0) return { data: null, error: null };
      const [deleted] = this.database.splice(index, 1);
      return { data: deleted ? { id: deleted.id } : null, error: null };
    }
    if (this.action === 'update') {
      if (index < 0) return { data: null, error: null };
      const updated = { ...this.database[index], ...(this.payload as Partial<TestRow>) } as TestRow;
      this.database[index] = updated;
      return { data: this.singleResult ? updated : [updated], error: null };
    }
    const matches = this.database.filter((entry) => this.matches(entry));
    return { data: this.singleResult ? matches[0] ?? null : matches, error: null };
  }

  private insertRow(): QueryResult {
    const inserted = this.payload as TestRow;
    const duplicate = this.database.some((entry) =>
      entry.user_id === inserted.user_id && entry.entry_date === inserted.entry_date,
    );
    if (duplicate) return { data: null, error: { code: '23505' } };
    this.database.push(inserted);
    return { data: inserted, error: null };
  }

  private matches(entry: TestRow): boolean {
    return [...this.filters].every(([field, value]) => entry[field as keyof TestRow] === value);
  }
}