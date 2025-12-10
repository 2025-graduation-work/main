import React from 'react';
import { Visit, Destination } from '@/app/lib/types';

interface HistoryListProps {
  pageVisits: Visit[];
  filteredVisitsCount: number;
  destinations: Destination[];
  setPage: React.Dispatch<React.SetStateAction<number>>;
}

export function HistoryList({
  pageVisits,
  filteredVisitsCount,
  destinations,
  setPage,
}: HistoryListProps) {
  return (
    <section className="mb-6">
      <h3 className="font-semibold mb-2 text-sm sm:text-base">📋 訪問履歴一覧</h3>
      <div className="border p-2 sm:p-3 rounded bg-white">
        {pageVisits.length === 0 ? (
          <p className="text-gray-500 text-sm">訪問履歴がありません</p>
        ) : (
          <ul className="space-y-2 sm:space-y-3">
            {pageVisits.map((v) => (
              <li key={v.id} className="border-l-4 border-green-500 pl-2 text-sm break-words">
                <p className="font-semibold truncate">
                  {destinations.find((d) => d.id === v.destinationId)?.name ?? v.destinationId} -{' '}
                  {new Date(v.visitedAt).toLocaleString('ja-JP')}
                </p>
                {v.note && <p className="text-xs text-gray-600 line-clamp-2">{v.note}</p>}
              </li>
            ))}
          </ul>
        )}

        {pageVisits.length < filteredVisitsCount && (
          <div className="mt-3">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 bg-gray-100 border rounded text-sm hover:bg-gray-200"
            >
              さらに読み込む
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
