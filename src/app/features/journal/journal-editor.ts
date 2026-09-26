import { Component, DestroyRef, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { JournalDraft, Mood, MOODS } from '../../core/models/journal-entry';
import { JournalService } from '../../core/services/journal.service';
import { getPastWeekDates } from './date-shortcuts';

interface JournalForm {
  date: FormControl<string>;
  title: FormControl<string>;
  content: FormControl<string>;
  mood: FormControl<Mood>;
}

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-journal-editor',
  templateUrl: './journal-editor.html',
})
export class JournalEditor {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly journal = inject(JournalService);
  private readonly destroyRef = inject(DestroyRef);
  readonly moods = MOODS;
  readonly today = localDateString(new Date());
  readonly recentDates = getPastWeekDates(this.today);
  readonly entryId = signal<string | undefined>(undefined);
  readonly missingEntry = signal(false);
  readonly duplicateEntryId = signal<string | undefined>(undefined);
  readonly saveError = signal('');
  readonly form = new FormGroup<JournalForm>({
    date: new FormControl(this.today, {
      nonNullable: true,
      validators: [Validators.required, notAfterToday(this.today)],
    }),
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    content: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    mood: new FormControl<Mood>('okay', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id') ?? undefined;
      this.entryId.set(id);
      this.missingEntry.set(false);
      if (!id) return;

      const entry = this.journal.getById(id);
      if (!entry) {
        this.missingEntry.set(true);
        return;
      }
      this.form.setValue({
        date: entry.date,
        title: entry.title,
        content: entry.content,
        mood: entry.mood,
      });
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const mood = params.get('mood');
      if (MOODS.some((option) => option.value === mood)) {
        this.form.controls.mood.setValue(mood as Mood);
      }
    });
  }

  chooseDate(date: string): void {
    this.form.controls.date.setValue(date);
    this.form.controls.date.markAsTouched();
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.missingEntry()) return;

    const draft: JournalDraft = this.form.getRawValue();
    this.duplicateEntryId.set(undefined);
    this.saveError.set('');
    try {
      const result = this.journal.save(draft, this.entryId());
      if (result.status === 'duplicate') {
        this.duplicateEntryId.set(result.entry.id);
        return;
      }
      void this.router.navigate(['/journal', result.entry.id]);
    } catch {
      this.saveError.set('Your entry could not be saved in this browser. Check available storage and try again.');
    }
  }
}

function notAfterToday(today: string): ValidatorFn {
  return (control): ValidationErrors | null => {
    const value = control.value;
    return typeof value === 'string' && value > today ? { futureDate: true } : null;
  };
}

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}