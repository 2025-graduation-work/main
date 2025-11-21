import { Check, MapPin } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Location, TaskCompletion } from '@/app/lib/types';

interface TaskHistoryProps {
  locations: Location[];
  completions: TaskCompletion[];
}

export function TaskHistory({ locations, completions }: TaskHistoryProps) {
  // Group completions by date
  const groupedByDate = completions.reduce((acc, completion) => {
    if (!acc[completion.date]) {
      acc[completion.date] = [];
    }
    acc[completion.date].push(completion);
    return acc;
  }, {} as Record<string, TaskCompletion[]>);

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = dateString;
    const todayString = today.toISOString().split('T')[0];
    const yesterdayString = yesterday.toISOString().split('T')[0];

    if (dateOnly === todayString) {
      return '今日';
    } else if (dateOnly === yesterdayString) {
      return '昨日';
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
  };

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const getLocationName = (locationId: string): string => {
    const location = locations.find(loc => loc.id === locationId);
    return location?.name || '削除された場所';
  };

  if (completions.length === 0) {
    return (
      <Card className="p-12 text-center bg-white/80 backdrop-blur-sm border-gray-200">
        <Check className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">まだ履歴がありません</p>
        <p className="text-sm text-gray-500 mt-2">場所を追加してチェックインしてみましょう</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-gray-900">{formatDate(date)}</h3>
            <Badge variant="secondary">
              {groupedByDate[date].length}件
            </Badge>
          </div>
          <div className="space-y-2">
            {groupedByDate[date]
              .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
              .map((completion, index) => (
                <Card key={index} className="p-4 bg-white/80 backdrop-blur-sm border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900">{getLocationName(completion.locationId)}</p>
                      <p className="text-sm text-gray-500">{formatTime(completion.completedAt)}</p>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
