'use client';

import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
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

const mapContainerStyle = {
  width: '100%',
  height: '600px',
};

function MapViewContent({ destinations, onDestinationClick }: MapViewProps) {
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null);
  const [isLoadingPosition, setIsLoadingPosition] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [mapState, setMapState] = useState({ lat: 35.6812, lng: 139.7671, zoom: 12 });

  // マップの中心とズームを自動計算（destinations に基づいて）
  const calculateMapBounds = useCallback(() => {
    if (destinations.length === 0) {
      return { center: { lat: 35.6812, lng: 139.7671 }, zoom: 12 };
    }

    const lats = destinations.map(d => d.latitude);
    const lngs = destinations.map(d => d.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // ズームレベルを距離に基づいて計算（簡易版）
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);

    let zoom = 12;
    if (maxDiff > 0.5) zoom = 10;
    else if (maxDiff > 0.1) zoom = 12;
    else if (maxDiff > 0.05) zoom = 13;
    else zoom = 14;

    return { center: { lat: centerLat, lng: centerLng }, zoom };
  }, [destinations]);

  // destinations が変更されたとき地図をフィット
  useEffect(() => {
    const bounds = calculateMapBounds();
    setMapState({ ...bounds.center, zoom: bounds.zoom });
  }, [calculateMapBounds]);

  // eslint-disable-next-line react-hooks/exhaustive-deps

  const getCurrentPosition = () => {
    setIsLoadingPosition(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentPosition(position);
          setIsLoadingPosition(false);
          toast.success('現在位置を取得しました');
          // 地図の中心を現在位置に更新
          setMapState({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            zoom: 14,
          });
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

  // マウント時に現在位置を取得（useEffect 外で呼び出す警告を回避）
  useEffect(() => {
    // 現在位置取得を遅延実行
    const timer = setTimeout(() => {
      getCurrentPosition();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

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
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={{ lat: mapState.lat, lng: mapState.lng }}
          zoom={mapState.zoom}
          options={{
            gestureHandling: 'greedy',
            zoomControl: true,
            mapTypeControl: true,
          }}
        >
          {/* 目的地のマーカー */}
          {destinations.map((destination) => (
            <Marker
              key={destination.id}
              position={{
                lat: destination.latitude,
                lng: destination.longitude,
              }}
              title={destination.name}
              onClick={() => {
                setSelectedDestination(destination);
                onDestinationClick(destination);
              }}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#6366f1',
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 2,
              }}
            />
          ))}

          {/* 現在位置のマーカー */}
          {currentPosition && (
            <Marker
              position={{
                lat: currentPosition.coords.latitude,
                lng: currentPosition.coords.longitude,
              }}
              title="現在位置"
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#22c55e', // 緑色
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 3,
              }}
            />
          )}

          {/* 選択された目的地の情報ウィンドウ */}
          {selectedDestination && (
            <InfoWindow
              position={{
                lat: selectedDestination.latitude,
                lng: selectedDestination.longitude,
              }}
              onCloseClick={() => setSelectedDestination(null)}
            >
              <div className="p-2 bg-white rounded">
                <h3 className="font-bold text-sm text-gray-900">{selectedDestination.name}</h3>
                <p className="text-xs text-gray-600">{selectedDestination.address}</p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* Destination Count */}
        <div className="absolute top-3 right-16 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-4 py-2 border border-gray-200 z-10">
          <p className="text-sm text-gray-600">
            目的地: <span className="text-gray-900">{destinations.length}</span>件
          </p>
        </div>
      </Card>

      {/* Instructions */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>ヒント:</strong> ピンをクリックすると目的地の詳細が表示されます。
          Google Maps APIにより実際の地図上にピンを表示しています。
        </p>
      </Card>
    </div>
  );
}

export function MapView({ destinations, onDestinationClick }: MapViewProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  if (!isLoaded) {
    return (
      <Card className="relative bg-white/80 backdrop-blur-sm overflow-hidden h-[600px] flex items-center justify-center">
        <p className="text-gray-500">マップを読み込み中...</p>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card className="relative bg-white/80 backdrop-blur-sm overflow-hidden h-[600px] flex items-center justify-center">
        <p className="text-red-500">マップの読み込みに失敗しました</p>
      </Card>
    );
  }

  return <MapViewContent destinations={destinations} onDestinationClick={onDestinationClick} />;
}
