import { useState, useEffect } from 'react';
import { MapPin, Calendar, Clock, Edit2, Trash2, X, Navigation } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Destination, Visit } from '@/app/lib/types';
import { getNextSchedule } from '@/app/lib/dateUtils';

import { getCurrentLocation, calculateDistance } from '@/app/lib/locationUtils';
import { cn } from '@/app/lib/utils';

interface DestinationDetailModalProps {
  destination: Destination;
  visits: Visit[];
  onClose: () => void;
  onUpdate: (updates: Partial<Destination>) => void;
  onDelete: () => void;
  onCheckIn: (location?: { latitude: number; longitude: number }) => void;
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

export function DestinationDetailModal({
  destination,
  visits,
  onClose,
  onUpdate,
  onDelete,
  onCheckIn,
}: DestinationDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editedFrequency, setEditedFrequency] = useState(destination.frequency);
  const [distance, setDistance] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    checkDistance();
  }, []);

  const checkDistance = async () => {
    setIsCheckingLocation(true);
    setLocationError(null);
    try {
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      const dist = calculateDistance(
        location.latitude,
        location.longitude,
        destination.latitude,
        destination.longitude
      );
      setDistance(dist);
    } catch (error) {
      console.error('Location error:', error);
      setLocationError('現在地を取得できませんでした');
    } finally {
      setIsCheckingLocation(false);
    }
  };

  const handleCheckIn = () => {
    onCheckIn(currentLocation);
    onClose();
  };

  const nextSchedule = getNextSchedule(destination, visits);
  const isToday = new Date().toDateString() === nextSchedule.toDateString();

  const canCheckIn = isToday && distance !== null && distance <= 1000;

  const formatDays = () => {
    return destination.frequency.days.map(d => DAYS[d].label).join('・');
  };

  const toggleDay = (day: number) => {
    const days = editedFrequency.days.includes(day)
      ? editedFrequency.days.filter(d => d !== day)
      : [...editedFrequency.days, day].sort((a, b) => a - b);

    setEditedFrequency({ ...editedFrequency, days });
  };

  const setTime = (time: string) => {
    setEditedFrequency({ ...editedFrequency, time });
  };

  const handleSave = () => {
    if (editedFrequency.days.length === 0) {
      toast.error('少なくとも1つの曜日を選択してください');
      return;
    }
    onUpdate({ frequency: editedFrequency });
    setIsEditing(false);
    toast.success('頻度を更新しました');
  };

  const handleDelete = () => {
    onDelete();
    setShowDeleteDialog(false);
    toast.success('目的地を削除しました');
  };

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">目的地の詳細</DialogTitle>
              {!isEditing && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditing(true)}
                    className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Destination Info */}
            <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-900 mb-1">{destination.name}</h3>
                  <p className="text-sm text-gray-600">{destination.address}</p>
                </div>
              </div>
            </Card>

            {/* Check-in Section */}
            {!isEditing && (
              <Card className="p-4 bg-white border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">チェックイン</h4>
                      <p className="text-xs text-gray-500">
                        {isCheckingLocation ? (
                          "位置情報を確認中..."
                        ) : locationError ? (
                          <span className="text-red-500">{locationError}</span>
                        ) : distance !== null ? (
                          `目的地まで約 ${Math.round(distance)}m`
                        ) : (
                          "位置情報を取得できません"
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={checkDistance}
                    disabled={isCheckingLocation}
                  >
                    更新
                  </Button>
                </div>

                <Button
                  className={cn(
                    "w-full gap-2",
                    canCheckIn
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  )}
                  disabled={!canCheckIn}
                  onClick={handleCheckIn}
                >
                  <MapPin className="w-4 h-4" />
                  {canCheckIn ? "チェックインする" : "目的地に近づいてください (1000m以内)"}
                </Button>
              </Card>
            )}



            {/* Frequency */}
            {!isEditing ? (
              <div className="space-y-3">
                <Label>訪問頻度</Label>
                <Card className="p-4 bg-white border-gray-200">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">{formatDays()}曜日</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">{destination.frequency.time}</span>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <div className="space-y-4">
                <Label>頻度を編集</Label>

                {/* Days */}
                <div className="space-y-2">
                  <Label className="text-sm">曜日</Label>
                  <div className="grid grid-cols-7 gap-2">
                    {DAYS.map((day) => {
                      const isSelected = editedFrequency.days.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          onClick={() => toggleDay(day.value)}
                          className={`aspect-square rounded-lg border-2 transition-all ${isSelected
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

                {/* Time */}
                <div className="space-y-2">
                  <Label htmlFor="edit-time" className="text-sm">時刻</Label>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <Input
                      id="edit-time"
                      type="time"
                      value={editedFrequency.time}
                      onChange={(e) => setTime(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                </div>

                {/* Edit Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditedFrequency(destination.frequency);
                      setIsEditing(false);
                    }}
                    className="flex-1"
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    保存
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>目的地を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{destination.name}」を削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
