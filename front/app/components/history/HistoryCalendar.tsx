import React from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Visit, Destination } from '@/app/lib/types';

interface HistoryCalendarProps {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  visitedDates: Date[];
  filteredVisits: Visit[];
  destinations: Destination[];
}

export function HistoryCalendar({
  selectedDate,
  setSelectedDate,
  visitedDates,
  filteredVisits,
  destinations,
}: HistoryCalendarProps) {
  return (
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
                <p className="font-semibold truncate">
                  {destinations.find((d) => d.id === v.destinationId)?.name ?? v.destinationId} -{' '}
                  {new Date(v.visitedAt).toLocaleTimeString('ja-JP')}
                </p>
                {v.note && <p className="text-xs text-gray-600 line-clamp-2">{v.note}</p>}
              </li>
            ))}
          </ul>
          <button onClick={() => setSelectedDate(undefined)} className="mt-2 text-xs sm:text-sm text-blue-600">
            日付選択を解除
          </button>
        </div>
      )}
    </section>
  );
}
