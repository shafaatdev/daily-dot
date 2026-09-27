import { DatePipe } from '@angular/common';
import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { JournalEntry, MOODS } from '../../core/models/journal-entry';
import { JournalService } from '../../core/services/journal.service';

@Component({
  imports: [DatePipe, RouterLink],
  selector: 'app-journal-detail',
  templateUrl: './journal-detail.html',
})
export class JournalDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly journal = inject(JournalService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly deleteDialog = viewChild.required<ElementRef<HTMLDialogElement>>('deleteDialog');
  readonly entry = signal<JournalEntry | undefined>(undefined);
  readonly deleteError = signal('');
  readonly deleting = signal(false);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      this.entry.set(id ? this.journal.getById(id) : undefined);
    });
  }

  moodEmoji(value: string): string {
    return MOODS.find((mood) => mood.value === value)?.emoji ?? '•';
  }

  moodLabel(value: string): string {
    return MOODS.find((mood) => mood.value === value)?.label ?? 'Unknown mood';
  }

  openDeleteDialog(): void {
    this.deleteDialog().nativeElement.showModal();
  }

  closeDeleteDialog(): void {
    this.deleteDialog().nativeElement.close();
  }

  dismissOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeDeleteDialog();
  }

  async deleteEntry(entry: JournalEntry): Promise<void> {
    if (this.deleting()) return;
    this.deleting.set(true);
    this.deleteError.set('');
    const result = await this.journal.delete(entry.id);
    this.deleting.set(false);
    if (result.status === 'deleted') {
      void this.router.navigate(['/journal']);
    } else if (result.status === 'error') {
      this.deleteError.set(result.message);
    } else {
      this.deleteError.set('This entry is no longer available.');
    }
  }
}