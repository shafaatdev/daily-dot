import { JournalDraft, JournalEntry } from '../models/journal-entry';
import { JournalService } from './journal.service';
import { beforeEach, describe, expect, it } from 'vitest';

const USER_ID = 'active-local-user';
const ENTRIES_KEY = 'daily-dot.entries.v1';
const USER_KEY = 'daily-dot.local-user.v1';
const SEED_KEY = `daily-dot.initial-data.v1.${USER_ID}`;

describe('JournalService', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(USER_KEY, USER_ID);
    localStorage.setItem(SEED_KEY, 'true');
  });

  it('persists a new entry with the active local identity and timestamps', () => {
    const journal = new JournalService();
    const result = journal.save(draft('2026-03-10'));

    expect(result.status).toBe('saved');
    if (result.status !== 'saved') return;
    expect(result.entry.userId).toBe(USER_ID);
    expect(result.entry.createdAt).toBeTruthy();
    expect(result.entry.updatedAt).toBe(result.entry.createdAt);
    expect(JSON.parse(localStorage.getItem(ENTRIES_KEY) ?? '[]')).toHaveLength(1);
  });

  it('returns the existing entry when another entry uses the same date', () => {
    const journal = new JournalService();
    const existing = journal.save(draft('2026-03-10'));
    const duplicate = journal.save({ ...draft('2026-03-10'), title: 'Another note' });

    expect(existing.status).toBe('saved');
    expect(duplicate.status).toBe('duplicate');
    if (existing.status === 'saved' && duplicate.status === 'duplicate') {
      expect(duplicate.entry.id).toBe(existing.entry.id);
    }
    expect(journal.entries()).toHaveLength(1);
  });

  it('preserves creation time when editing and rejects moving onto an occupied date', () => {
    const journal = new JournalService();
    const first = journal.save(draft('2026-03-10'));
    const second = journal.save(draft('2026-03-09'));
    expect(first.status).toBe('saved');
    expect(second.status).toBe('saved');
    if (first.status !== 'saved' || second.status !== 'saved') return;

    const duplicate = journal.save(draft('2026-03-09'), first.entry.id);
    const updated = journal.save({ ...draft('2026-03-10'), title: 'Revised' }, first.entry.id);

    expect(duplicate.status).toBe('duplicate');
    expect(updated.status).toBe('saved');
    if (updated.status === 'saved') {
      expect(updated.entry.createdAt).toBe(first.entry.createdAt);
      expect(Date.parse(updated.entry.updatedAt)).toBeGreaterThan(
        Date.parse(first.entry.updatedAt),
      );
      expect(updated.entry.title).toBe('Revised');
    }
    expect(journal.entries()).toHaveLength(2);
  });

  it('keeps other local identities isolated without overwriting their records', () => {
    const otherEntry: JournalEntry = {
      id: 'other-entry',
      userId: 'another-local-user',
      ...draft('2026-03-08'),
      createdAt: '2026-03-08T09:00:00.000Z',
      updatedAt: '2026-03-08T09:00:00.000Z',
    };
    localStorage.setItem(ENTRIES_KEY, JSON.stringify([otherEntry]));

    const journal = new JournalService();
    expect(journal.entries()).toEqual([]);
    journal.save(draft('2026-03-10'));

    const savedEntries = JSON.parse(localStorage.getItem(ENTRIES_KEY) ?? '[]') as JournalEntry[];
    expect(savedEntries.map((entry) => entry.userId)).toEqual([
      'another-local-user',
      USER_ID,
    ]);
  });

  it('loads entries again after the service is recreated and supports deletion', () => {
    const firstService = new JournalService();
    const result = firstService.save(draft('2026-03-10'));
    expect(result.status).toBe('saved');
    if (result.status !== 'saved') return;

    const refreshedService = new JournalService();
    expect(refreshedService.getById(result.entry.id)?.title).toBe('A day kept');
    expect(refreshedService.delete(result.entry.id)).toBe(true);
    expect(refreshedService.entries()).toEqual([]);
  });

  it('creates at least 25 varied initial entries only once for an empty local journal', () => {
    localStorage.removeItem(SEED_KEY);
    const journal = new JournalService();
    const entries = journal.entries();

    expect(entries.length).toBeGreaterThanOrEqual(25);
    expect(new Set(entries.map((entry) => entry.date)).size).toBe(entries.length);
    expect(new Set(entries.map((entry) => entry.createdAt.slice(11, 16))).size).toBeGreaterThan(5);
    expect(entries.every((entry) => entry.userId === USER_ID)).toBe(true);
    expect(localStorage.getItem(SEED_KEY)).toBe('true');
  });

  it('does not recreate initial entries after they have all been deleted', () => {
    localStorage.removeItem(SEED_KEY);
    const journal = new JournalService();
    for (const entry of journal.entries()) journal.delete(entry.id);

    const refreshedService = new JournalService();
    expect(refreshedService.entries()).toEqual([]);
  });
});

function draft(date: string): JournalDraft {
  return {
    date,
    title: 'A day kept',
    content: 'A few honest lines.',
    mood: 'good',
  };
}