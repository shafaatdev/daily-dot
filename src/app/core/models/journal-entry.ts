export const MOODS = [
  { value: 'great', label: 'Great', emoji: '😄' },
  { value: 'good', label: 'Good', emoji: '🙂' },
  { value: 'okay', label: 'Okay', emoji: '😐' },
  { value: 'low', label: 'Low', emoji: '😔' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
] as const;

export type Mood = (typeof MOODS)[number]['value'];

export interface JournalEntry {
  id: string;
  userId: string;
  date: string;
  title: string;
  content: string;
  mood: Mood;
  createdAt: string;
  updatedAt: string;
}

export interface JournalDraft {
  date: string;
  title: string;
  content: string;
  mood: Mood;
}

export type SaveJournalResult =
  | { status: 'saved'; entry: JournalEntry }
  | { status: 'duplicate'; entry: JournalEntry }
  | { status: 'error'; message: string };

export type DeleteJournalResult =
  | { status: 'deleted' }
  | { status: 'not-found' }
  | { status: 'error'; message: string };