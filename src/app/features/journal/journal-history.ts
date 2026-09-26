import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JournalEntry, MOODS } from '../../core/models/journal-entry';
import { JournalService } from '../../core/services/journal.service';

@Component({
  imports: [DatePipe, RouterLink],
  selector: 'app-journal-history',
  templateUrl: './journal-history.html',
})
export class JournalHistory {
  private readonly journal = inject(JournalService);
  readonly moods = MOODS;
  readonly query = signal('');
  readonly selectedMood = signal('all');
  readonly selectedMonth = signal('');
  readonly entries = computed(() => {
    const query = this.query().trim().toLocaleLowerCase();
    return [...this.journal.entries()]
      .filter((entry) => {
        const matchesQuery =
          !query ||
          entry.title.toLocaleLowerCase().includes(query) ||
          entry.content.toLocaleLowerCase().includes(query);
        const matchesMood =
          this.selectedMood() === 'all' || entry.mood === this.selectedMood();
        const matchesMonth =
          !this.selectedMonth() || entry.date.startsWith(this.selectedMonth());
        return matchesQuery && matchesMood && matchesMonth;
      })
      .sort(
        (first, second) =>
          second.date.localeCompare(first.date) ||
          second.updatedAt.localeCompare(first.updatedAt),
      );
  });

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