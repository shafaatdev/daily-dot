import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JournalEntry, MOODS } from '../../core/models/journal-entry';
import { JournalService } from '../../core/services/journal.service';
import { calculateJournalStatistics } from '../../core/utils/journal-statistics';

@Component({
  imports: [DatePipe, RouterLink],
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly journal = inject(JournalService);
  readonly moods = MOODS;
  readonly today = localDateString(new Date());
  readonly todayForDisplay = new Date(`${this.today}T12:00:00`);
  readonly todayEntry = computed(() => this.journal.findByDate(this.today));
  readonly sortedEntries = computed(() => sortEntries(this.journal.entries()));
  readonly recentEntries = computed(() => this.sortedEntries().slice(0, 4));
  readonly moodTrend = computed(() => this.sortedEntries().slice(0, 7).reverse());
  readonly greeting = getGreeting();
  readonly statistics = computed(() =>
    calculateJournalStatistics(this.journal.entries(), this.today),
  );

  moodEmoji(value: string): string {
    return MOODS.find((mood) => mood.value === value)?.emoji ?? '•';
  }

  moodLabel(value: string): string {
    return MOODS.find((mood) => mood.value === value)?.label ?? 'Unknown mood';
  }

  localDate(value: string): Date {
    return new Date(`${value}T12:00:00`);
  }
}

function sortEntries(entries: JournalEntry[]): JournalEntry[] {
  return [...entries].sort(
    (first, second) =>
      second.date.localeCompare(first.date) ||
      second.updatedAt.localeCompare(first.updatedAt),
  );
}

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}