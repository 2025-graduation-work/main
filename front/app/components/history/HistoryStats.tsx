import React from 'react';

interface HistoryStatsProps {
  totalVisits: number;
  mostVisitedName: string;
  mostVisitedCount: number;
  streak: number;
}

export function HistoryStats({
  totalVisits,
  mostVisitedName,
  mostVisitedCount,
  streak,
}: HistoryStatsProps) {
  return (
    <section>
      <h3 className="font-semibold mb-2 text-sm sm:text-base">📈 統計</h3>
      <div className="border p-2 sm:p-3 rounded bg-white space-y-2 text-sm">
        <p>
          総訪問回数: <strong>{totalVisits}</strong>
        </p>
        <p>
          最も訪問した目的地: <strong>{mostVisitedName}</strong>（{mostVisitedCount}回）
        </p>
        <p>
          連続訪問日数（ストリーク）: <strong>{streak}</strong>日
        </p>
      </div>
    </section>
  );
}
