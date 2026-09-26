import { JournalEntry, Mood } from '../models/journal-entry';
import { calculateJournalStatistics } from './journal-statistics';
import { describe, expect, it } from 'vitest';

describe('calculateJournalStatistics', () => {
  it('counts entries, current-month entries, and the most frequent mood', () => {
    const statistics = calculateJournalStatistics(
      [entry('2026-03-10', 'good'), entry('2026-03-08', 'good'), entry('2026-02-20', 'sad')],
      '2026-03-10',
    );

    expect(statistics.total).toBe(3);
    expect(statistics.entriesThisMonth).toBe(2);
    expect(statistics.mostFrequentMood?.value).toBe('good');
  });

  it('counts a streak through today or yesterday, and stops at a gap', () => {
    const throughToday = calculateJournalStatistics(
      [entry('2026-03-08'), entry('2026-03-09'), entry('2026-03-10')],
      '2026-03-10',
    );
    const throughYesterday = calculateJournalStatistics(
      [entry('2026-03-08'), entry('2026-03-09')],
      '2026-03-10',
    );
    const afterGap = calculateJournalStatistics(
      [entry('2026-03-07'), entry('2026-03-08')],
      '2026-03-10',
    );

    expect(throughToday.currentStreak).toBe(3);
    expect(throughYesterday.currentStreak).toBe(2);
    expect(afterGap.currentStreak).toBe(0);
  });

  it('returns no most-frequent mood for an empty journal', () => {
    const statistics = calculateJournalStatistics([], '2026-03-10');

    expect(statistics.total).toBe(0);
    expect(statistics.currentStreak).toBe(0);
    expect(statistics.entriesThisMonth).toBe(0);
    expect(statistics.mostFrequentMood).toBeUndefined();
  });
});

function entry(date: string, mood: Mood = 'okay'): JournalEntry {
  return {
    id: date,
    userId: 'local-user',
    date,
    title: 'A day kept',
    content: 'A few honest lines.',
    mood,
    createdAt: `${date}T09:00:00.000Z`,
    updatedAt: `${date}T09:00:00.000Z`,
  };
}