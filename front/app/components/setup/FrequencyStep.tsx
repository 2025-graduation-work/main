import { Calendar, Clock } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Destination } from '@/app/lib/types';

interface FrequencyStepProps {
  destination: Omit<Destination, 'id' | 'createdAt'> | null;
  setDestination: (destination: Omit<Destination, 'id' | 'createdAt'>) => void;
}

const DAYS = [
  { label: '日', value: 0 },
  { label: '月', value: 1 },
  { label: '火', value: 2 },
  { label: '水', value: 3 },
  { label: '木', value: 4 },
  { label: '金', value: 5 },
  { label: '土', value: 6 },
];

export function FrequencyStep({ destination, setDestination }: FrequencyStepProps) {
  if (!destination) return null;

  const toggleDay = (day: number) => {
    const days = destination.frequency.days.includes(day)
      ? destination.frequency.days.filter(d => d !== day)
      : [...destination.frequency.days, day].sort((a, b) => a - b);

    setDestination({
      ...destination,
      frequency: { ...destination.frequency, days },
    });
  };

  const setTime = (time: string) => {
    setDestination({
      ...destination,
      frequency: { ...destination.frequency, time },
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="p-8 bg-white/80 backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-gray-900 mb-2">訪れる頻度を設定しましょう</h2>
          <p className="text-gray-600">週に何回、いつ訪れるかを選択してください</p>
        </div>

        {/* Selected Destination */}
        <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 mb-8">
          <p className="text-sm text-gray-600 mb-1">設定中の目的地</p>
          <p className="text-gray-900">{destination.name}</p>
        </Card>

        <div className="space-y-6">
          {/* Days Selection */}
          <div className="space-y-3">
            <Label>曜日を選択</Label>
            <div className="grid grid-cols-7 gap-2">
              {DAYS.map((day) => {
                const isSelected = destination.frequency.days.includes(day.value);
                return (
                  <button
                    key={day.value}
                    onClick={() => toggleDay(day.value)}
                    className={`aspect-square rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500 text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-300'
                    }`}
                  >
                    <span className="text-sm">{day.label}</span>
                  </button>
                );
              })}
            </div>
            {destination.frequency.days.length > 0 && (
              <p className="text-sm text-gray-600">
                週に {destination.frequency.days.length} 回訪れる設定です
              </p>
            )}
          </div>

          {/* Time Selection */}
          <div className="space-y-3">
            <Label htmlFor="time">時刻を選択</Label>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-500" />
              <Input
                id="time"
                type="time"
                value={destination.frequency.time}
                onChange={(e) => setTime(e.target.value)}
                className="max-w-xs"
              />
            </div>
            <p className="text-sm text-gray-600">
              この時刻に訪れることを目標にします
            </p>
          </div>

          {/* Summary */}
          {destination.frequency.days.length > 0 && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>{destination.name}</strong>へ、
                <strong>
                  {destination.frequency.days.map(d => DAYS[d].label).join('・')}曜日
                </strong>
                の
                <strong>{destination.frequency.time}</strong>
                に訪れる設定です
              </p>
            </Card>
          )}
        </div>
      </Card>
    </div>
  );
}
