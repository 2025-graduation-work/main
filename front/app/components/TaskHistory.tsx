import React, { useMemo, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { useAtomValue } from 'jotai';
import { visitHistoryAtom, calculateCompletionRate } from '@/app/lib/store';
import { userDataAtom } from '@/app/lib/store';
import { Visit } from '@/app/lib/types';

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
    if (period === 'month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return date >= startOfWeek && date <= endOfWeek;
  };

  const parsedVisits: Visit[] = useMemo(() => (visits ?? []).map((v) => ({ ...v })), [visits]);

  const filteredVisits = useMemo(() => {
    let res = parsedVisits;
    if (selectedDestination !== 'all') res = res.filter((v) => v.destinationId === selectedDestination);
    if (selectedDate) {
      const dStr = selectedDate.toDateString();
      res = res.filter((v) => new Date(v.visitedAt).toDateString() === dStr);
    } else {
      res = res.filter((v) => inPeriod(new Date(v.visitedAt)));
    }
    return res.sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime());
  }, [parsedVisits, selectedDestination, period, selectedDate]);

  const visitedDates = useMemo(() => {
    const set = new Map<string, Date>();
    filteredVisits.forEach((v) => {
      const d = new Date(v.visitedAt);
      const key = d.toDateString();
      if (!set.has(key)) set.set(key, new Date(d.getFullYear(), d.getMonth(), d.getDate()));
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
    const uniqueDays = Array.from(new Set(parsedVisits.map((v) => new Date(v.visitedAt).toDateString())))
      .map((s) => new Date(s))
      .sort((a, b) => b.getTime() - a.getTime());
    if (uniqueDays.length === 0) return 0;
    let count = 0;
    let prev = new Date();
    prev.setHours(0, 0, 0, 0);
    for (let i = 0; i < uniqueDays.length; i++) {
      const d = uniqueDays[i];
      d.setHours(0, 0, 0, 0);
      if (i === 0) {
        const diff = Math.floor((prev.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 0) count = 1;
        else if (diff === 1) count = 1;
        else break;
      } else {
        const prevDay = uniqueDays[i - 1];
        const expected = new Date(prevDay);
        expected.setDate(prevDay.getDate() - 1);
        expected.setHours(0, 0, 0, 0);
        if (d.getTime() === expected.getTime()) count++;
        else break;
      }
    }
    return count;
  }, [parsedVisits]);

  const perDestinationRates = useMemo(() => {
    return destinations.map((d) => {
      const target = d.frequency?.days?.length > 0 ? d.frequency.days.length : 1;
      const result = calculateCompletionRate(parsedVisits, d.id, target);
      return { id: d.id, name: d.name, ...result };
    });
  }, [destinations, parsedVisits]);

  const overallRate = useMemo(() => {
    if (perDestinationRates.length === 0) return 0;
    const sum = perDestinationRates.reduce((s, r) => s + r.rate, 0);
    return Math.round((sum / perDestinationRates.length) * 10) / 10;
  }, [perDestinationRates]);

  return (
    <div className="w-full">
      <h2 className="text-lg sm:text-xl font-bold mb-3">習慣化の記録</h2>

        <section className="mb-4 overflow-hidden">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base">今週の達成率: <strong>{overallRate}%</strong></p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${overallRate}%` }} />
              </div>
            </div>

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
