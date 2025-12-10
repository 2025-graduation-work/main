import React from 'react';

interface DestinationDebugStatsProps {
  perDestinationRates: {
    id: string;
    name: string;
    completed: number;
    target: number;
    rate: number;
  }[];
}

export function DestinationDebugStats({ perDestinationRates }: DestinationDebugStatsProps) {
  return (
    <section className="mb-6">
      <h3 className="font-semibold mb-2 text-sm sm:text-base">🔎 目的地ごとの達成率（デバッグ）</h3>
      <div className="border p-2 sm:p-3 rounded bg-white text-sm">
        {perDestinationRates.map((p) => (
          <div key={p.id} className="flex justify-between py-1">
            <div className="flex-1 truncate">{p.name}</div>
            <div className="text-right">
              {p.completed}/{p.target} ({p.rate.toFixed(1)}%)
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
