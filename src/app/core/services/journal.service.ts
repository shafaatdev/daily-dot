import { computed, Injectable, signal } from '@angular/core';
import {
  JournalDraft,
  JournalEntry,
  MOODS,
  SaveJournalResult,
} from '../models/journal-entry';
import { createInitialJournalEntries } from '../utils/initial-journal-data';

const ENTRIES_STORAGE_KEY = 'daily-dot.entries.v1';
const USER_STORAGE_KEY = 'daily-dot.local-user.v1';
const INITIAL_DATA_STORAGE_KEY = 'daily-dot.initial-data.v1';

@Injectable({ providedIn: 'root' })
export class JournalService {
  private readonly userId = this.getOrCreateUserId();
  private readonly storedEntries = signal<JournalEntry[]>(this.loadEntries());
  readonly entries = computed(() =>
    this.storedEntries().filter((entry) => entry.userId === this.userId),
  );

  getById(id: string): JournalEntry | undefined {
    return this.entries().find((entry) => entry.id === id);
  }

  findByDate(date: string): JournalEntry | undefined {
    return this.entries().find((entry) => entry.date === date);
  }

  save(draft: JournalDraft, id?: string): SaveJournalResult {
    const existing = id ? this.getById(id) : undefined;
    const duplicate = this.findByDate(draft.date);

    if (duplicate && duplicate.id !== existing?.id) {
      return { status: 'duplicate', entry: duplicate };
    }

    const now = Date.now();
    const previousUpdatedAt = existing ? Date.parse(existing.updatedAt) : Number.NaN;
    const updatedAt = new Date(
      Math.max(now, Number.isFinite(previousUpdatedAt) ? previousUpdatedAt + 1 : now),
    ).toISOString();
    const entry: JournalEntry = {
      ...draft,
      id: existing?.id ?? crypto.randomUUID(),
      userId: this.userId,
      createdAt: existing?.createdAt ?? updatedAt,
      updatedAt,
    };
    const nextEntries = existing
      ? this.storedEntries().map((current) =>
          current.id === existing.id ? entry : current,
        )
      : [...this.storedEntries(), entry];

    this.persist(nextEntries);
    this.storedEntries.set(nextEntries);
    return { status: 'saved', entry };
  }

  delete(id: string): boolean {
    const entry = this.getById(id);
    if (!entry) return false;

    const nextEntries = this.storedEntries().filter(
      (current) => current.id !== entry.id,
    );
    this.persist(nextEntries);
    this.storedEntries.set(nextEntries);
    return true;
  }

  private getOrCreateUserId(): string {
    const storedUserId = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUserId) return storedUserId;

    const userId = crypto.randomUUID();
    localStorage.setItem(USER_STORAGE_KEY, userId);
    return userId;
  }

  private readEntries(): JournalEntry[] {
    const storedEntries = localStorage.getItem(ENTRIES_STORAGE_KEY);
    if (!storedEntries) return [];

    try {
      const parsed: unknown = JSON.parse(storedEntries);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isJournalEntry);
    } catch {
      return [];
    }
  }

  private loadEntries(): JournalEntry[] {
    const entries = this.readEntries();
    const seedMarker = `${INITIAL_DATA_STORAGE_KEY}.${this.userId}`;
    if (localStorage.getItem(seedMarker)) return entries;

    if (entries.some((entry) => entry.userId === this.userId)) {
      localStorage.setItem(seedMarker, 'true');
      return entries;
    }

    const seededEntries = [...entries, ...createInitialJournalEntries(this.userId)];
    this.persist(seededEntries);
    localStorage.setItem(seedMarker, 'true');
    return seededEntries;
  }

  private persist(entries: JournalEntry[]): void {
    localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(entries));
  }
}

function isJournalEntry(value: unknown): value is JournalEntry {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry['id'] === 'string' &&
    typeof entry['userId'] === 'string' &&
    typeof entry['date'] === 'string' &&
    typeof entry['title'] === 'string' &&
    typeof entry['content'] === 'string' &&
    typeof entry['mood'] === 'string' &&
    MOODS.some((mood) => mood.value === entry['mood']) &&
    typeof entry['createdAt'] === 'string' &&
    typeof entry['updatedAt'] === 'string'
  );
}