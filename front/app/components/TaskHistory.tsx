import React, { useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { visitHistoryAtom, calculateCompletionRate, userDataAtom } from '@/app/lib/store';
import { Visit } from '@/app/lib/types';
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

import { HistoryHeader } from './history/HistoryHeader';
import { HistoryCalendar } from './history/HistoryCalendar';
import { HistoryList } from './history/HistoryList';
import { HistoryStats } from './history/HistoryStats';
import { DestinationDebugStats } from './history/DestinationDebugStats';

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
      // If the date is newer than expected (e.g. we are looking for yesterday but this date is today, and we started expecting yesterday), skip.
      // But based on logic, if hasToday is true, we start with today. If not, we start with yesterday.
      // Since uniqueDates is sorted descending, we should just match.
      if (isSameDay(d, expectedDate)) {
        currentStreak++;
        expectedDate = subDays(expectedDate, 1);
      } else if (d < expectedDate) {
        // Gap found
        break;
      }
    }
    return currentStreak;
  }, [parsedVisits]);

  const perDestinationRates = useMemo(() => {
    return destinations.map((d) => {
      const target = d.frequency?.days?.length > 0 ? d.frequency.days.length : 1;
      const result = calculateCompletionRate(parsedVisits, d.id, target, {
        period,
        frequencyDays: d.frequency?.days ?? [],
        referenceDate: new Date(),
      });
      return { id: d.id, name: d.name, ...result };
    });
  }, [destinations, parsedVisits, period]);

  const overallRate = useMemo(() => {
    if (perDestinationRates.length === 0) return 0;
    if (selectedDestination !== 'all') {
      const item = perDestinationRates.find((p) => p.id === selectedDestination);
      return item ? Math.round(item.rate * 10) / 10 : 0;
    }
    // Compute overall rate as total completed / total target across destinations
    const totalCompleted = perDestinationRates.reduce((s, p) => s + (p.completed ?? 0), 0);
    const totalTarget = perDestinationRates.reduce((s, p) => s + (p.target ?? 0), 0);
    if (totalTarget <= 0) return 0;
    const rate = (totalCompleted / totalTarget) * 100;
    return Math.round(Math.min(rate, 100) * 10) / 10;
  }, [perDestinationRates, selectedDestination]);

  return (
    <div className="w-full">
      <h2 className="text-lg sm:text-xl font-bold mb-3">習慣化の記録</h2>

      <HistoryHeader
        period={period}
        setPeriod={setPeriod}
        selectedDestination={selectedDestination}
        setSelectedDestination={setSelectedDestination}
        destinations={destinations}
        overallRate={overallRate}
      />

      <HistoryCalendar
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        visitedDates={visitedDates}
        filteredVisits={filteredVisits}
        destinations={destinations}
      />

      <HistoryList
        pageVisits={pageVisits}
        filteredVisitsCount={filteredVisits.length}
        destinations={destinations}
        page={page}
        setPage={setPage}
      />

      <DestinationDebugStats perDestinationRates={perDestinationRates} />

      <HistoryStats
        totalVisits={totalVisits}
        mostVisitedName={mostVisitedName}
        mostVisitedCount={mostVisited.count}
        streak={streak}
      />
    </div>
  );
}
