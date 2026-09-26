export interface DateShortcut {
  value: string;
  label: string;
  shortDate: string;
}

export function getPastWeekDates(todayDate: string): DateShortcut[] {
  const [year, month, day] = todayDate.split('-').map(Number);
  const today = new Date(year, month - 1, day);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));

    return {
      value: localDateString(date),
      label: index === 6 ? 'Today' : formatWeekday(date),
      shortDate: formatShortDate(date),
    };
  });
}

function formatWeekday(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
}

function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
