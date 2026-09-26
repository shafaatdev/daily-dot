import { JournalEntry, Mood } from '../models/journal-entry';

interface InitialEntryTemplate {
  daysAgo: number;
  hour: number;
  minute: number;
  updateMinutes: number;
  title: string;
  content: string;
  mood: Mood;
}

const INITIAL_ENTRY_TEMPLATES: readonly InitialEntryTemplate[] = [
  { daysAgo: 0, hour: 8, minute: 12, updateMinutes: 64, title: 'A slower start', content: 'I left a little room in the morning instead of rushing. Breakfast tasted better when I sat down for it.', mood: 'good' },
  { daysAgo: 1, hour: 21, minute: 4, updateMinutes: 37, title: 'Small things that helped', content: 'A walk after work and a call with a friend softened a long day.', mood: 'good' },
  { daysAgo: 2, hour: 7, minute: 48, updateMinutes: 105, title: 'Too many tabs open', content: 'My mind kept jumping between tasks. Writing the next three steps down made them feel more manageable.', mood: 'okay' },
  { daysAgo: 4, hour: 19, minute: 26, updateMinutes: 52, title: 'A bright patch', content: 'The afternoon sun came through the kitchen window while I made tea. I paused long enough to notice.', mood: 'great' },
  { daysAgo: 6, hour: 22, minute: 11, updateMinutes: 28, title: 'A quiet evening', content: 'Nothing remarkable happened, and that was exactly what I needed.', mood: 'okay' },
  { daysAgo: 7, hour: 6, minute: 55, updateMinutes: 91, title: 'Monday, gently', content: 'I started with one task rather than the whole week. That was enough to get going.', mood: 'good' },
  { daysAgo: 10, hour: 20, minute: 42, updateMinutes: 46, title: 'A hard conversation', content: 'I said what I meant and listened carefully. It was uncomfortable but honest.', mood: 'low' },
  { daysAgo: 12, hour: 9, minute: 17, updateMinutes: 73, title: 'Making something', content: 'I spent an hour cooking without a recipe. The result was imperfect and very good.', mood: 'great' },
  { daysAgo: 13, hour: 18, minute: 3, updateMinutes: 32, title: 'A little worn out', content: 'The week caught up with me today. I gave myself permission to keep the evening simple.', mood: 'low' },
  { daysAgo: 16, hour: 7, minute: 31, updateMinutes: 58, title: 'One thing at a time', content: 'I focused on finishing one small job before moving to the next. It helped more than expected.', mood: 'okay' },
  { daysAgo: 18, hour: 21, minute: 19, updateMinutes: 84, title: 'Dinner around the table', content: 'We stayed at the table long after eating and traded stories from the week.', mood: 'great' },
  { daysAgo: 20, hour: 11, minute: 6, updateMinutes: 49, title: 'Rain on the windows', content: 'The rain changed my plans. I read at home and let the day take a different shape.', mood: 'good' },
  { daysAgo: 23, hour: 19, minute: 53, updateMinutes: 41, title: 'A slower pace', content: 'I noticed how tired I was and stopped trying to push through it. Rest felt productive tonight.', mood: 'low' },
  { daysAgo: 25, hour: 8, minute: 22, updateMinutes: 96, title: 'A useful reminder', content: 'Asking for help made the project easier for everyone, not just me.', mood: 'good' },
  { daysAgo: 28, hour: 22, minute: 38, updateMinutes: 25, title: 'Not my best day', content: 'Some things went sideways and I felt discouraged. Tomorrow does not need to be solved tonight.', mood: 'sad' },
  { daysAgo: 31, hour: 6, minute: 43, updateMinutes: 61, title: 'Fresh notebook', content: 'I moved a few thoughts from my head onto paper and found a clearer place to begin.', mood: 'okay' },
  { daysAgo: 34, hour: 20, minute: 15, updateMinutes: 78, title: 'A reason to celebrate', content: 'A small milestone passed today. I let myself feel proud before moving on to the next thing.', mood: 'great' },
  { daysAgo: 37, hour: 12, minute: 8, updateMinutes: 35, title: 'Lunch outside', content: 'I took lunch away from my desk and came back with a little more energy.', mood: 'good' },
  { daysAgo: 40, hour: 21, minute: 27, updateMinutes: 67, title: 'Missing home', content: 'I felt a little far from the people I love today. A familiar song made the distance feel smaller.', mood: 'sad' },
  { daysAgo: 44, hour: 7, minute: 14, updateMinutes: 103, title: 'A clear morning', content: 'The air was cool and the streets were quiet. I took the longer route and did not regret it.', mood: 'great' },
  { daysAgo: 48, hour: 18, minute: 47, updateMinutes: 29, title: 'A full calendar', content: 'I had less breathing room than I wanted. I moved one non-urgent task to tomorrow.', mood: 'low' },
  { daysAgo: 52, hour: 9, minute: 36, updateMinutes: 55, title: 'Learning as I go', content: 'I made a mistake, fixed it, and learned something useful. That counts as progress.', mood: 'okay' },
  { daysAgo: 56, hour: 22, minute: 2, updateMinutes: 42, title: 'The best kind of ordinary', content: 'A home-cooked meal, clean sheets, and a book waiting by the bed.', mood: 'good' },
  { daysAgo: 61, hour: 6, minute: 28, updateMinutes: 89, title: 'A little more courage', content: 'I finally sent the message I had been rewriting in my head. I am glad I did.', mood: 'great' },
  { daysAgo: 66, hour: 19, minute: 9, updateMinutes: 33, title: 'Low on energy', content: 'I kept the essentials moving and let the rest wait. That was the right call.', mood: 'low' },
  { daysAgo: 71, hour: 8, minute: 51, updateMinutes: 72, title: 'A new route', content: 'I changed my usual commute and found a small bakery on the next street over.', mood: 'good' },
  { daysAgo: 77, hour: 20, minute: 33, updateMinutes: 47, title: 'A day to reset', content: 'The day felt heavier than I expected. I made space for quiet and reached out to someone I trust.', mood: 'sad' },
  { daysAgo: 83, hour: 10, minute: 19, updateMinutes: 63, title: 'Plans came together', content: 'The pieces finally lined up after a week of uncertainty. I feel relieved and grateful.', mood: 'great' },
  { daysAgo: 90, hour: 17, minute: 44, updateMinutes: 31, title: 'Finding my rhythm', content: 'A steady routine is starting to feel natural. I want to keep what is working and stay flexible.', mood: 'okay' },
  { daysAgo: 98, hour: 7, minute: 5, updateMinutes: 94, title: 'A note to myself', content: 'Progress is not always loud. I have been showing up, and that matters.', mood: 'good' },
];

export function createInitialJournalEntries(
  userId: string,
  now = new Date(),
): JournalEntry[] {
  return INITIAL_ENTRY_TEMPLATES.map((template, index) => {
    const entryDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - template.daysAgo,
      template.hour,
      template.minute,
    );
    const date = localDateString(entryDate);

    return {
      id: `initial-${userId}-${index + 1}`,
      userId,
      date,
      title: template.title,
      content: template.content,
      mood: template.mood,
      createdAt: entryDate.toISOString(),
      updatedAt: new Date(
        entryDate.getTime() + template.updateMinutes * 60_000,
      ).toISOString(),
    };
  });
}

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
