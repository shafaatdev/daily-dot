import { JournalEntry, MOODS } from '../models/journal-entry';

export interface JournalStatistics {
  total: number;
  currentStreak: number;
  entriesThisMonth: number;
  mostFrequentMood: (typeof MOODS)[number] | undefined;
}

export function calculateJournalStatistics(
  entries: JournalEntry[],
  today: string,
): JournalStatistics {
  const moodCounts = new Map<string, number>();
  for (const entry of entries) {
    moodCounts.set(entry.mood, (moodCounts.get(entry.mood) ?? 0) + 1);
  }

  const mostFrequentMood = MOODS.find(
    (mood) => moodCounts.get(mood.value) === Math.max(0, ...moodCounts.values()),
  );

  return {
    total: entries.length,
    currentStreak: calculateStreak(entries, today),
    entriesThisMonth: entries.filter((entry) => entry.date.startsWith(today.slice(0, 7))).length,
    mostFrequentMood: entries.length ? mostFrequentMood : undefined,
  };
}

function calculateStreak(entries: JournalEntry[], today: string): number {
  const dates = new Set(entries.map((entry) => entry.date));
  let cursor = dates.has(today) ? today : addDays(today, -1);
  let streak = 0;

  while (dates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function addDays(date: string, amount: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const value = new Date(year, month - 1, day + amount);
  const localYear = value.getFullYear();
  const localMonth = String(value.getMonth() + 1).padStart(2, '0');
  const localDay = String(value.getDate()).padStart(2, '0');
  return `${localYear}-${localMonth}-${localDay}`;
}