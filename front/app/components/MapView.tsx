import { useState, useEffect } from 'react';
import { MapPin, Navigation, Locate } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { toast } from 'sonner';
import { Destination } from '@/app/lib/types';

interface MapViewProps {
  destinations: Destination[];
  onDestinationClick: (destination: Destination) => void;
}

export function MapView({ destinations, onDestinationClick }: MapViewProps) {
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null);
  const [isLoadingPosition, setIsLoadingPosition] = useState(false);

  const getCurrentPosition = () => {
    setIsLoadingPosition(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentPosition(position);
          setIsLoadingPosition(false);
          toast.success('現在位置を取得しました');
        },
        (error) => {
          setIsLoadingPosition(false);
          toast.error('位置情報の取得に失敗しました');
          console.error('Error getting location:', error);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setIsLoadingPosition(false);
      toast.error('位置情報がサポートされていません');
    }
  };

  useEffect(() => {
    // 初回ロード時に現在位置を取得
    getCurrentPosition();
  }, []);

  // 地図の中心とズームレベルを計算
  const getMapBounds = () => {
    if (destinations.length === 0 && !currentPosition) {
      // デフォルト: 東京
      return { centerLat: 35.6812, centerLng: 139.7671, zoom: 12 };
    }

    const points = [...destinations.map(d => ({ lat: d.latitude, lng: d.longitude }))];
    if (currentPosition) {
      points.push({ 
        lat: currentPosition.coords.latitude, 
        lng: currentPosition.coords.longitude 
      });
    }

    if (points.length === 0) {
      return { centerLat: 35.6812, centerLng: 139.7671, zoom: 12 };
    }

    const lats = points.map(p => p.lat);
    const lngs = points.map(p => p.lng);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

    return { centerLat, centerLng, zoom: 13 };
  };

  const bounds = getMapBounds();

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {currentPosition ? (
            <Badge variant="outline" className="gap-1 bg-green-50 border-green-300 text-green-700">
              <Locate className="w-3 h-3" />
              現在位置を表示中
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <MapPin className="w-3 h-3" />
              位置情報未取得
            </Badge>
          )}
        </div>
        <Button
          onClick={getCurrentPosition}
          disabled={isLoadingPosition}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Navigation className="w-4 h-4" />
          {isLoadingPosition ? '取得中...' : '現在位置を更新'}
        </Button>
      </div>

      {/* Map Container */}
      <Card className="relative bg-white/80 backdrop-blur-sm overflow-hidden">
        {/* Mock Map Background */}
        <div className="relative w-full h-[600px] bg-gradient-to-br from-blue-50 via-gray-50 to-green-50">
          {/* Grid lines for map effect */}
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Note about Google Maps */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            <Badge className="bg-white/90 backdrop-blur-sm text-gray-700 border-gray-300">
              実装時はGoogle Maps APIを使用します
            </Badge>
          </div>

          {/* Destination Pins */}
          {destinations.map((destination, index) => {
            // 簡易的な位置計算（実際はGoogle Maps APIで処理）
            const offsetX = 30 + (index % 3) * 35;
            const offsetY = 30 + Math.floor(index / 3) * 35;
            
            return (
              <button
                key={destination.id}
                onClick={() => onDestinationClick(destination)}
                className="absolute transform -translate-x-1/2 -translate-y-full group cursor-pointer"
                style={{
                  left: `${offsetX}%`,
                  top: `${offsetY}%`,
                }}
              >
                {/* Pin Shadow */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/20 rounded-full blur-sm" />
                
                {/* Pin */}
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border-4 border-white">
                    <MapPin className="w-5 h-5 text-white" fill="white" />
                  </div>
                  
                  {/* Pin pointer */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-purple-600" />
                  
                  {/* Label */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-lg shadow-lg whitespace-nowrap border border-gray-200">
                      <p className="text-sm text-gray-900">{destination.name}</p>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {/* Current Location Pin */}
          {currentPosition && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
              style={{
                left: '50%',
                top: '50%',
              }}
            >
              {/* Pulse animation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-blue-400 rounded-full animate-ping opacity-20" />
              </div>
              
              {/* Current location marker */}
              <div className="relative w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-xl border-4 border-white">
                <Locate className="w-6 h-6 text-white" />
              </div>
              
              {/* Label */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2">
                <div className="bg-blue-500 text-white px-3 py-1 rounded-lg shadow-lg whitespace-nowrap text-sm">
                  現在位置
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-900 mb-3">凡例</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <MapPin className="w-3 h-3 text-white" fill="white" />
              </div>
              <span className="text-sm text-gray-700">目的地</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <Locate className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm text-gray-700">現在位置</span>
            </div>
          </div>
        </div>

        {/* Destination Count */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-4 py-2 border border-gray-200">
          <p className="text-sm text-gray-600">
            目的地: <span className="text-gray-900">{destinations.length}</span>件
          </p>
        </div>
      </Card>

      {/* Instructions */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>ヒント:</strong> ピンをクリックすると目的地の詳細が表示されます。
          実装時はGoogle Maps APIを統合することで、実際の地図上にピンを表示できます。
        </p>
      </Card>
    </div>
  );
}
