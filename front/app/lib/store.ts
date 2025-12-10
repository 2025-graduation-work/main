import { atomWithStorage } from 'jotai/utils';
import { UserData, Visit } from './types';

export const userDataAtom = atomWithStorage<UserData | null>(
  'userData',
  null,
  {
    getItem: (key: string) => {
      if (typeof window === 'undefined') return null;
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    },
    setItem: (key: string, value: UserData | null) => {
      if (typeof window === 'undefined') return;
      localStorage.setItem(key, JSON.stringify(value));
    },
    removeItem: (key: string) => {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(key);
    },
  }
);

// 訪問履歴Atom
export const visitHistoryAtom = atomWithStorage<Visit[]>(
  'visitHistory',
  [],
  {
    getItem: (key: string) => {
      if (typeof window === 'undefined') return [];
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : [];
    },
    setItem: (key: string, value: Visit[]) => {
      if (typeof window === 'undefined') return;
      localStorage.setItem(key, JSON.stringify(value));
    },
    removeItem: (key: string) => {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(key);
    },
  }
);

// ヘルパー関数: 特定の目的地の訪問履歴を取得
export const getVisitsByDestination = (visits: Visit[], destinationId: string): Visit[] => {
  return visits.filter((visit) => visit.destinationId === destinationId);
};

// ヘルパー関数: 達成率を計算（週の目標回数 vs 実際の訪問回数）
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  getDaysInMonth,
  getDay,
  differenceInCalendarWeeks,
  min,
  max,
} from 'date-fns';

// ヘルパー関数: 達成率を計算（週の目標回数 vs 実際の訪問回数）
export const calculateCompletionRate = (
  visits: Visit[],
  destinationId: string,
  targetFrequency: number,
  options?: {
    period?: 'week' | 'month' | 'all';
    frequencyDays?: number[]; // 0-6 (Sun-Sat)
    referenceDate?: Date;
  }
): { completed: number; target: number; rate: number } => {
  const { period = 'week', frequencyDays = [], referenceDate = new Date() } = options ?? {};

  let start: Date | null = null;
  let end: Date | null = null;

  if (period === 'week') {
    start = startOfWeek(referenceDate);
    end = endOfWeek(referenceDate);
  } else if (period === 'month') {
    start = startOfMonth(referenceDate);
    end = endOfMonth(referenceDate);
  }

  const periodVisits = visits.filter((visit) => {
    if (visit.destinationId !== destinationId) return false;
    if (period === 'all') return true;
    const visitDate = new Date(visit.visitedAt);
    if (!start || !end) return false;
    return isWithinInterval(visitDate, { start, end });
  });

  const completed = periodVisits.length;

  let target = targetFrequency;
  if (period === 'month') {
    // Calculate monthly target correctly based on frequencyDays
    if (frequencyDays && frequencyDays.length > 0) {
      const year = referenceDate.getFullYear();
      const month = referenceDate.getMonth();
      const daysInMonth = getDaysInMonth(referenceDate);
      let count = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(year, month, d);
        if (frequencyDays.includes(getDay(dt))) count++;
      }
      target = count;
    } else {
      // fallback: approximate 4.3 weeks
      target = Math.ceil(targetFrequency * (getDaysInMonth(referenceDate) / 7));
    }
  } else if (period === 'all') {
    if (visits.length === 0) {
      target = targetFrequency;
    } else {
      const dates = visits.filter((v) => v.destinationId === destinationId).map((v) => new Date(v.visitedAt));
      if (dates.length === 0) {
        target = targetFrequency;
      } else {
        const minDate = min(dates);
        const maxDate = max(dates);
        // Add 1 to include the partial week
        const weeks = Math.max(1, differenceInCalendarWeeks(maxDate, minDate) + 1);
        target = targetFrequency * weeks;
      }
    }
  }

  const rate = target > 0 ? (completed / target) * 100 : 0;
  return {
    completed,
    target,
    rate: Math.min(rate, 100),
  };
};
