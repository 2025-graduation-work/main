import { useState } from 'react';
import { MapPin, Check, Trash2, Navigation } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/app/components/ui/alert-dialog';
import { Location } from '@/app/lib/types';

interface LocationTaskCardProps {
  location: Location;
  isCompleted: boolean;
  currentPosition: GeolocationPosition | null;
  onComplete: (locationId: string) => void;
  onDelete: (locationId: string) => void;
}

export function LocationTaskCard({
  location,
  isCompleted,
  currentPosition,
  onComplete,
  onDelete,
}: LocationTaskCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const calculateDistance = (): number | null => {
    if (!currentPosition) return null;

    const R = 6371e3; // Earth's radius in meters
    const φ1 = (currentPosition.coords.latitude * Math.PI) / 180;
    const φ2 = (location.latitude * Math.PI) / 180;
    const Δφ = ((location.latitude - currentPosition.coords.latitude) * Math.PI) / 180;
    const Δλ = ((location.longitude - currentPosition.coords.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const distance = calculateDistance();
  const isNearby = distance !== null && distance <= location.radius;
  const canComplete = isNearby && !isCompleted;

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const openInMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <>
      <Card className={`p-6 transition-all ${
        isCompleted 
          ? 'bg-green-50 border-green-200' 
          : 'bg-white/80 backdrop-blur-sm border-gray-200 hover:shadow-md'
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start gap-3 mb-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                isCompleted 
                  ? 'bg-green-500' 
                  : isNearby 
                  ? 'bg-blue-500' 
                  : 'bg-gray-300'
              }`}>
                {isCompleted ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <MapPin className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-gray-900 mb-1">{location.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{location.address}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {isCompleted && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
                      <Check className="w-3 h-3 mr-1" />
                      完了
                    </Badge>
                  )}
                  {distance !== null && !isCompleted && (
                    <Badge variant="outline" className={isNearby ? 'border-blue-500 text-blue-700' : ''}>
                      <Navigation className="w-3 h-3 mr-1" />
                      {formatDistance(distance)}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-gray-600">
                    範囲: {location.radius}m
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={openInMaps}
              className="flex-shrink-0"
            >
              <Navigation className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
              className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {canComplete && (
          <Button
            onClick={() => onComplete(location.id)}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
          >
            <Check className="w-4 h-4 mr-2" />
            チェックイン
          </Button>
        )}

        {!isCompleted && distance !== null && !isNearby && (
          <p className="text-sm text-gray-500 mt-4 text-center">
            この場所から{location.radius}m以内に近づくとチェックインできます
          </p>
        )}
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>場所を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{location.name}」を削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(location.id);
                setShowDeleteDialog(false);
              }}
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
