import { atomWithStorage } from 'jotai/utils';
import { UserData, Visit } from './types';

export const userDataAtom = atomWithStorage<UserData | null>(
  'userData',
  null,
  {
    getItem: (key: string) => {
      if (typeof window === 'undefined') return null;
      const value = sessionStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    },
    setItem: (key: string, value: UserData | null) => {
      if (typeof window === 'undefined') return;
      sessionStorage.setItem(key, JSON.stringify(value));
    },
    removeItem: (key: string) => {
      if (typeof window === 'undefined') return;
      sessionStorage.removeItem(key);
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
      const value = sessionStorage.getItem(key);
      return value ? JSON.parse(value) : [];
    },
    setItem: (key: string, value: Visit[]) => {
      if (typeof window === 'undefined') return;
      sessionStorage.setItem(key, JSON.stringify(value));
    },
    removeItem: (key: string) => {
      if (typeof window === 'undefined') return;
      sessionStorage.removeItem(key);
    },
  }
);

// ヘルパー関数: 特定の目的地の訪問履歴を取得
export const getVisitsByDestination = (visits: Visit[], destinationId: string): Visit[] => {
  return visits.filter((visit) => visit.destinationId === destinationId);
};

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
    start = new Date(referenceDate);
    start.setDate(referenceDate.getDate() - referenceDate.getDay());
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'month') {
    start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  }

  const periodVisits = visits.filter((visit) => {
    if (visit.destinationId !== destinationId) return false;
    if (period === 'all') return true;
    const visitDate = new Date(visit.visitedAt);
    if (!start || !end) return false;
    return visitDate >= start && visitDate <= end;
  });

  const completed = periodVisits.length;

  let target = targetFrequency;
  if (period === 'month') {
    // Calculate monthly target using frequencyDays to count how many matching weekdays occur in month
    if (frequencyDays && frequencyDays.length > 0) {
      const year = referenceDate.getFullYear();
      const month = referenceDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      let count = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(year, month, d);
        if (frequencyDays.includes(dt.getDay())) count++;
      }
      target = count;
    } else {
      // fallback: approximate 4 weeks
      target = targetFrequency * 4;
    }
  } else if (period === 'all') {
    // For all, use targetFrequency as weekly target; let's calculate target per number of weeks in data range
    if (visits.length === 0) target = targetFrequency;
    else {
      const dates = visits.filter(v => v.destinationId === destinationId).map(v => new Date(v.visitedAt));
      if (dates.length === 0) target = targetFrequency;
      else {
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        const weeks = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (7 * 24 * 60 * 60 * 1000)));
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
