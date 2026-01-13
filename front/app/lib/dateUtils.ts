import { Destination } from './types';

const DAYS = ['日', '月', '火', '水', '木', '金', '土'];

/**
 * Calculates the next occurrence date for a destination based on its frequency.
 * If the current day is included in frequency, it counts as "today" regardless of time,
 * matching common Todo list behavior (tasks are for the day).
 */
export function getNextSchedule(destination: Destination): Date {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayDay = today.getDay(); // 0-6

  // Check if today is a scheduled day
  if (destination.frequency.days.includes(todayDay)) {
    return today;
  }

  // Find the closest future day
  // Sort days to iterate easily, though usually they might be sorted.
  // We'll just check 1..6 days ahead.
  for (let i = 1; i <= 7; i++) {
    const nextDay = (todayDay + i) % 7;
    if (destination.frequency.days.includes(nextDay)) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      return nextDate;
    }
  }

  // Fallback (shouldn't happen if days is not empty)
  return today;
}

/**
 * Formats a date into a string key for grouping.
 * e.g., "今日 (1/13)", "明日 (1/14)", "1/15 (水)"
 */
export function formatDateGroup(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(today.getDate() + 2);

  // Strip time for comparison
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayOfWeek = DAYS[d.getDay()];

  if (d.getTime() === today.getTime()) {
    return `今日 (${month}/${day})`;
  } else if (d.getTime() === tomorrow.getTime()) {
    return `明日 (${month}/${day})`;
  } else if (d.getTime() === dayAfterTomorrow.getTime()) {
    return `明後日 (${month}/${day})`;
  } else {
    return `${month}/${day} (${dayOfWeek})`;
  }
}

/**
 * Groups destinations by their next scheduled date.
 * Returns an object where keys are date group strings and values are arrays of destinations.
 */
export function groupDestinationsByDate(destinations: Destination[]): Record<string, Destination[]> {
  const groups: Record<string, Destination[]> = {};

  // Sort destinations by next schedule first to ensure order within groups (though grouping splits them)
  // And we want the groups themselves to be ordered by date.
  // Actually, we'll return a Record, but iterating over it might not be ordered.
  // A Better approach for rendering might be to return an array of { title: string, destinations: Destination[], date: Date }
  // But let's stick to the Plan logic of logic first, maybe render helper returns ordered list.

  // Re-thinking: To make rendering easy, let's just augment logic here or in component.
  // Let's keep this function returning a structured object or Map, but Map preserves insertion order.

  const destsWithDate = destinations.map(d => ({
    destination: d,
    nextDate: getNextSchedule(d)
  }));

  destsWithDate.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());

  destsWithDate.forEach(({ destination, nextDate }) => {
    const key = formatDateGroup(nextDate);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(destination);
  });

  return groups;
}

/**
 * Returns grouped destinations as an ordered array for easy iteration in UI.
 */
export function getSortedDestinationGroups(destinations: Destination[]) {
  const destsWithDate = destinations.map(d => ({
    destination: d,
    nextDate: getNextSchedule(d)
  }));

  // Sort logic: earlier dates first.
  destsWithDate.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());

  const groups: { title: string; destinations: Destination[] }[] = [];

  destsWithDate.forEach(({ destination, nextDate }) => {
    const title = formatDateGroup(nextDate);
    const existingGroup = groups.find(g => g.title === title);
    if (existingGroup) {
      existingGroup.destinations.push(destination);
    } else {
      groups.push({ title, destinations: [destination] });
    }
  });

  return groups;
}
