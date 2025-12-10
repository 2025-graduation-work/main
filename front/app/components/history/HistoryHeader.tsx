import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Destination } from '@/app/lib/types';

type Period = 'week' | 'month' | 'all';

interface HistoryHeaderProps {
  period: Period;
  setPeriod: (period: Period) => void;
  selectedDestination: string | 'all';
  setSelectedDestination: (value: string | 'all') => void;
  destinations: Destination[];
  overallRate: number;
}

export function HistoryHeader({
  period,
  setPeriod,
  selectedDestination,
  setSelectedDestination,
  destinations,
  overallRate,
}: HistoryHeaderProps) {
  return (
    <section className="mb-4 overflow-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base">
            {period === 'week' ? '今週の達成率' : period === 'month' ? '今月の達成率' : '達成率'}:{' '}
            <strong>{overallRate}%</strong>
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${overallRate}%` }} />
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:space-x-2 sm:flex-shrink-0">
          <Select value={selectedDestination} onValueChange={(value) => setSelectedDestination(value)}>
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
  );
}
