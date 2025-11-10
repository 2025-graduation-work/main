import { MapPin, Calendar, Clock, Check } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Destination, CheckIn } from '@/app/lib/types';
import { toast } from 'sonner';

interface DestinationCardProps {
  destination: Destination;
  onClick: () => void;
  onCheckIn?: (checkIn: CheckIn) => void;
}

const DAYS = ['日', '月', '火', '水', '木', '金', '土'];

export function DestinationCard({ destination, onClick, onCheckIn }: DestinationCardProps) {
  const formatDays = () => {
    return destination.frequency.days.map(d => DAYS[d]).join('・');
  };

  // チェックイン状態の判定
  const now = new Date();
  const today = now.getDay();
  const isScheduledToday = destination.frequency.days.includes(today);
  
  // 今日のチェックイン履歴があるか確認
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const hasCheckedInToday = destination.checkIns?.some(checkIn => {
    const checkInDate = new Date(checkIn.timestamp);
    return checkInDate >= todayStart;
  }) || false;

  const totalCheckIns = destination.checkIns?.length || 0;
  
  // 状態の決定
  const isCheckInAvailable = isScheduledToday && !hasCheckedInToday;
  const isCheckedIn = hasCheckedInToday;

  const handleCheckIn = async (e: React.MouseEvent) => {
    e.stopPropagation(); // カードのonClickを発火させない
    
    if (!onCheckIn) return;

    try {
      if (!navigator.geolocation) {
        toast.error('位置情報がサポートされていません');
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const newCheckIn: CheckIn = {
        id: crypto.randomUUID(),
        destinationId: destination.id,
        timestamp: new Date().toISOString(),
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      onCheckIn(newCheckIn);
      toast.success('チェックインしました！');
    } catch (error) {
      console.error('チェックインエラー:', error);
      toast.error('位置情報の取得に失敗しました');
    }
  };

  return (
    <Card
      onClick={onClick}
      className={`p-6 backdrop-blur-sm hover:shadow-lg transition-all cursor-pointer border-2 ${
        isCheckInAvailable
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:border-green-400'
          : isCheckedIn
          ? 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-300 hover:border-gray-400'
          : 'bg-white/80 hover:border-indigo-300'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
          isCheckInAvailable
            ? 'bg-gradient-to-br from-green-500 to-emerald-500'
            : isCheckedIn
            ? 'bg-gradient-to-br from-gray-500 to-slate-500'
            : 'bg-gradient-to-br from-indigo-500 to-purple-500'
        }`}>
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-gray-900 truncate">{destination.name}</h3>
            {isCheckedIn && (
              <Badge variant="outline" className="gap-1 bg-gray-100 border-gray-300 text-gray-700">
                <Check className="w-3 h-3" />
                済
              </Badge>
            )}
            {totalCheckIns > 0 && !isCheckedIn && (
              <Badge variant="outline" className="gap-1">
                <Check className="w-3 h-3" />
                {totalCheckIns}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-3 truncate">{destination.address}</p>
          
          <div className="flex flex-wrap gap-2 items-center">
            {destination.frequency.days.length > 0 && (
              <Badge variant="outline" className="gap-1">
                <Calendar className="w-3 h-3" />
                {formatDays()}
              </Badge>
            )}
            <Badge variant="outline" className="gap-1">
              <Clock className="w-3 h-3" />
              {destination.frequency.time}
            </Badge>
          </div>

          {/* チェックインボタン */}
          {isCheckInAvailable && onCheckIn && (
            <Button
              onClick={handleCheckIn}
              size="sm"
              className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Check className="w-4 h-4 mr-1" />
              チェックインする
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
