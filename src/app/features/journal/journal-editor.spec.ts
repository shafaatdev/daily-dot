import { describe, expect, it } from 'vitest';
import { getPastWeekDates } from './date-shortcuts';

describe('getPastWeekDates', () => {
  it('returns the last seven dates including today in chronological order', () => {
    const dates = getPastWeekDates('2026-03-10');

    expect(dates.map((option) => option.value)).toEqual([
      '2026-03-04',
      '2026-03-05',
      '2026-03-06',
      '2026-03-07',
      '2026-03-08',
      '2026-03-09',
      '2026-03-10',
    ]);
    expect(dates[6].label).toBe('Today');
  });
});
