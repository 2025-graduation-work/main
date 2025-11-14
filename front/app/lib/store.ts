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
  targetFrequency: number
): { completedThisWeek: number; targetFrequency: number; rate: number } => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // 日曜日を開始
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const thisWeekVisits = visits.filter((visit) => {
    if (visit.destinationId !== destinationId) return false;
    const visitDate = new Date(visit.visitedAt);
    return visitDate >= startOfWeek && visitDate <= endOfWeek;
  });

  const completedThisWeek = thisWeekVisits.length;
  const rate = targetFrequency > 0 ? (completedThisWeek / targetFrequency) * 100 : 0;

  return {
    completedThisWeek,
    targetFrequency,
    rate: Math.min(rate, 100), // 100%を超えないようにキャップ
  };
};
