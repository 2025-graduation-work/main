import { useState } from 'react';
import { MapPin, Search, Calendar, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Card } from '@/app/components/ui/card';
import { toast } from 'sonner';
import { Destination } from '@/app/lib/types';

interface AddDestinationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (destination: Omit<Destination, 'id' | 'createdAt'>) => void;
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

const mockSearchResults = [
  { name: '新宿御苑', address: '東京都新宿区内藤町11', lat: 35.6851, lng: 139.7101 },
  { name: '代々木公園', address: '東京都渋谷区代々木神園町2-1', lat: 35.6719, lng: 139.6960 },
  { name: '上野公園', address: '東京都台東区上野公園5-20', lat: 35.7148, lng: 139.7743 },
];

export function AddDestinationDialog({ open, onOpenChange, onAdd }: AddDestinationDialogProps) {
  const [step, setStep] = useState<'search' | 'frequency'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<typeof mockSearchResults[0] | null>(null);
  const [frequency, setFrequency] = useState({ days: [] as number[], time: '10:00' });

  const resetDialog = () => {
    setStep('search');
    setSearchQuery('');
    setSelectedPlace(null);
    setFrequency({ days: [], time: '10:00' });
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetDialog();
    }
    onOpenChange(open);
  };

  const toggleDay = (day: number) => {
    const days = frequency.days.includes(day)
      ? frequency.days.filter(d => d !== day)
      : [...frequency.days, day].sort((a, b) => a - b);

    setFrequency({ ...frequency, days });
  };

  const handleAdd = () => {
    if (!selectedPlace) {
      toast.error('場所を選択してください');
      return;
    }
    if (frequency.days.length === 0) {
      toast.error('少なくとも1つの曜日を選択してください');
      return;
    }

    onAdd({
      name: selectedPlace.name,
      address: selectedPlace.address,
      latitude: selectedPlace.lat,
      longitude: selectedPlace.lng,
      frequency,
    });

    toast.success('目的地を追加しました');
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {step === 'search' ? '目的地を検索' : '頻度を設定'}
          </DialogTitle>
        </DialogHeader>

        {step === 'search' ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-search">場所を検索</Label>
              <div className="flex gap-2">
                <Input
                  id="add-search"
                  type="text"
                  placeholder="例: 新宿御苑"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button className="gap-2">
                  <Search className="w-4 h-4" />
                  検索
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                ※ 実装時はGoogle Maps Places APIが必要です
              </p>
            </div>

            {searchQuery && (
              <div className="space-y-2">
                <Label>検索結果</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {mockSearchResults.map((place, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedPlace(place)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedPlace?.name === place.name
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 bg-white hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-gray-900">{place.name}</p>
                          <p className="text-sm text-gray-600">{place.address}</p>
                        </div>
                        {selectedPlace?.name === place.name && (
                          <Badge className="bg-indigo-600">選択中</Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => handleClose(false)}>
                キャンセル
              </Button>
              <Button
                onClick={() => setStep('frequency')}
                disabled={!selectedPlace}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                次へ
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {selectedPlace && (
              <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
                <p className="text-sm text-gray-600 mb-1">追加する目的地</p>
                <p className="text-gray-900">{selectedPlace.name}</p>
              </Card>
            )}

            <div className="space-y-3">
              <Label>曜日を選択</Label>
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map((day) => {
                  const isSelected = frequency.days.includes(day.value);
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
            </div>

            <div className="space-y-3">
              <Label htmlFor="add-time">時刻を選択</Label>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-500" />
                <Input
                  id="add-time"
                  type="time"
                  value={frequency.time}
                  onChange={(e) => setFrequency({ ...frequency, time: e.target.value })}
                  className="max-w-xs"
                />
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep('search')}>
                戻る
              </Button>
              <Button
                onClick={handleAdd}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                追加
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
