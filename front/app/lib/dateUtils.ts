import { Destination, Visit } from './types';

const DAYS = ['日', '月', '火', '水', '木', '金', '土'];

/**
 * Calculates the next occurrence date for a destination based on its frequency.
 * If the current day is included in frequency, it counts as "today" regardless of time.
 * If already visited today, returns the next scheduled date.
 */
export function getNextSchedule(destination: Destination, visits: Visit[] = []): Date {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayDay = today.getDay(); // 0-6

  // Check if already visited today
  const visitedToday = visits.some(v => {
    if (v.destinationId !== destination.id) return false;
    const vDate = new Date(v.visitedAt);
    return vDate.getFullYear() === today.getFullYear() &&
      vDate.getMonth() === today.getMonth() &&
      vDate.getDate() === today.getDate();
  });

  // If today is a scheduled day and NOT visited yet, return today
  if (destination.frequency.days.includes(todayDay) && !visitedToday) {
    return today;
  }

  // Find the closest future day
  for (let i = 1; i <= 7; i++) {
    const nextDay = (todayDay + i) % 7;
    if (destination.frequency.days.includes(nextDay)) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      return nextDate;
    }
  }

  // Fallback
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
 * Returns grouped destinations as an ordered array for easy iteration in UI.
 */
export function getSortedDestinationGroups(destinations: Destination[], visits: Visit[] = []) {
  const destsWithDate = destinations.map(d => ({
    destination: d,
    nextDate: getNextSchedule(d, visits)
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
