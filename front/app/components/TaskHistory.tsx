import React, { useMemo, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

import { useAtomValue } from 'jotai';
import { visitHistoryAtom } from '@/app/lib/store';
import { userDataAtom } from '@/app/lib/store';
import { Visit } from '@/app/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  startOfDay,
  subDays,
  isSameDay,
} from 'date-fns';

type Period = 'week' | 'month' | 'all';

export function TaskHistory() {
  const visits = useAtomValue(visitHistoryAtom) ?? [];
  const userData = useAtomValue(userDataAtom);
  const destinations = userData?.destinations ?? [];

  const [selectedDestination, setSelectedDestination] = useState<string | 'all'>('all');
  const [period, setPeriod] = useState<Period>('week');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const inPeriod = (date: Date) => {
    const now = new Date();
    if (period === 'all') return true;

    let start, end;
    if (period === 'month') {
      start = startOfMonth(now);
      end = endOfMonth(now);
    } else {
      // period === 'week'
      start = startOfWeek(now);
      end = endOfWeek(now);
    }
    return isWithinInterval(date, { start, end });
  };

  const parsedVisits: Visit[] = useMemo(() => (visits ?? []).map((v) => ({ ...v })), [visits]);

  const filteredVisits = useMemo(() => {
    let res = parsedVisits;
    if (selectedDestination !== 'all') res = res.filter((v) => v.destinationId === selectedDestination);
    if (selectedDate) {
      res = res.filter((v) => isSameDay(new Date(v.visitedAt), selectedDate));
    } else {
      res = res.filter((v) => inPeriod(new Date(v.visitedAt)));
    }
    return res.sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime());
  }, [parsedVisits, selectedDestination, period, selectedDate]);

  const visitedDates = useMemo(() => {
    const set = new Map<number, Date>();
    filteredVisits.forEach((v) => {
      const d = startOfDay(new Date(v.visitedAt));
      const key = d.getTime();
      if (!set.has(key)) set.set(key, d);
    });
    return Array.from(set.values());
  }, [filteredVisits]);

  const pageVisits = useMemo(() => filteredVisits.slice(0, page * pageSize), [filteredVisits, page]);

  const totalVisits = filteredVisits.length;

  const mostVisited = useMemo(() => {
    const counter: Record<string, number> = {};
    filteredVisits.forEach((v) => (counter[v.destinationId] = (counter[v.destinationId] || 0) + 1));
    const entries = Object.entries(counter);
    if (entries.length === 0) return { destinationId: null as string | null, count: 0 };
    entries.sort((a, b) => b[1] - a[1]);
    return { destinationId: entries[0][0], count: entries[0][1] };
  }, [filteredVisits]);

  const mostVisitedName = destinations.find((d) => d.id === mostVisited.destinationId)?.name ?? '―';

  const streak = useMemo(() => {
    const uniqueDates = Array.from(new Set(parsedVisits.map((v) => startOfDay(new Date(v.visitedAt)).getTime())))
      .map((t) => new Date(t))
      .sort((a, b) => b.getTime() - a.getTime());

    if (uniqueDates.length === 0) return 0;

    const today = startOfDay(new Date());
    const hasToday = uniqueDates.some((d) => isSameDay(d, today));
    const yesterday = subDays(today, 1);
    const hasYesterday = uniqueDates.some((d) => isSameDay(d, yesterday));

    if (!hasToday && !hasYesterday) return 0;

    let currentStreak = 0;
    let expectedDate = hasToday ? today : yesterday;

    for (const d of uniqueDates) {
      if (isSameDay(d, expectedDate)) {
        currentStreak++;
        expectedDate = subDays(expectedDate, 1);
      } else if (d < expectedDate) {
        break;
      }
    }
    return currentStreak;
  }, [parsedVisits]);

  return (
    <div className="w-full">
      <h2 className="text-lg sm:text-xl font-bold mb-3">習慣化の記録</h2>

        <section className="mb-4 overflow-hidden">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:space-x-2 sm:flex-shrink-0">
              <Select value={selectedDestination} onValueChange={(value) => setSelectedDestination(value as any)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="全ての目的地" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全ての目的地</SelectItem>
                  {destinations.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="期間を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">今週</SelectItem>
                  <SelectItem value="month">今月</SelectItem>
                  <SelectItem value="all">全期間</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

      <section className="mb-6 overflow-x-auto">
        <h3 className="font-semibold mb-2 text-sm sm:text-base">📅 カレンダー</h3>
        <div className="flex justify-center">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={(d) => setSelectedDate(d ?? undefined)}
            modifiers={{ visited: visitedDates }}
            modifiersClassNames={{ visited: 'bg-green-200' }}
          />
        </div>
        {selectedDate && (
          <div className="mt-3 p-3 border rounded bg-white">
            <h4 className="font-medium text-sm sm:text-base">{selectedDate.toLocaleDateString('ja-JP')}</h4>
            <ul className="mt-2 space-y-2">
              {filteredVisits.map((v) => (
                <li key={v.id} className="border-l-4 border-blue-500 pl-2 text-sm break-words">
                  <p className="font-semibold truncate">{destinations.find((d) => d.id === v.destinationId)?.name ?? v.destinationId} - {new Date(v.visitedAt).toLocaleTimeString('ja-JP')}</p>
                  {v.note && <p className="text-xs text-gray-600 line-clamp-2">{v.note}</p>}
                </li>
              ))}
            </ul>
            <button onClick={() => setSelectedDate(undefined)} className="mt-2 text-xs sm:text-sm text-blue-600">日付選択を解除</button>
          </div>
        )}
      </section>

      <section className="mb-6">
        <h3 className="font-semibold mb-2 text-sm sm:text-base">📋 訪問履歴一覧</h3>
        <div className="border p-2 sm:p-3 rounded bg-white">
          {pageVisits.length === 0 ? (
            <p className="text-gray-500 text-sm">訪問履歴がありません</p>
          ) : (
            <ul className="space-y-2 sm:space-y-3">
              {pageVisits.map((v) => (
                <li key={v.id} className="border-l-4 border-green-500 pl-2 text-sm break-words">
                  <p className="font-semibold truncate">{destinations.find((d) => d.id === v.destinationId)?.name ?? v.destinationId} - {new Date(v.visitedAt).toLocaleString('ja-JP')}</p>
                  {v.note && <p className="text-xs text-gray-600 line-clamp-2">{v.note}</p>}
                </li>
              ))}
            </ul>
          )}

          {pageVisits.length < filteredVisits.length && (
            <div className="mt-3">
              <button onClick={() => setPage((p) => p + 1)} className="px-3 py-1 bg-gray-100 border rounded text-sm hover:bg-gray-200">さらに読み込む</button>
            </div>
          )}
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-2 text-sm sm:text-base">📈 統計</h3>
        <div className="border p-2 sm:p-3 rounded bg-white space-y-2 text-sm">
          <p>総訪問回数: <strong>{totalVisits}</strong></p>
          <p>最も訪問した目的地: <strong>{mostVisitedName}</strong>（{mostVisited.count}回）</p>
          <p>連続訪問日数（ストリーク）: <strong>{streak}</strong>日</p>
        </div>
      </section>
    </div>
  );
}
