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
  focusedDestination?: Destination | null;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

function MapViewContent({ destinations, onDestinationClick, focusedDestination }: MapViewProps) {
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null);
  const [isLoadingPosition, setIsLoadingPosition] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [mapState, setMapState] = useState({ lat: 35.6812, lng: 139.7671, zoom: 12 });
  const [mapLoaded, setMapLoaded] = useState(false);

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
    if (focusedDestination) {
      setMapState({
        lat: focusedDestination.latitude,
        lng: focusedDestination.longitude,
        zoom: 15,
      });
      setSelectedDestination(focusedDestination);
    } else {
      const bounds = calculateMapBounds();
      setMapState({ ...bounds.center, zoom: bounds.zoom });
    }
  }, [calculateMapBounds, focusedDestination]);

  // eslint-disable-next-line react-hooks/exhaustive-deps

  const getCurrentPosition = (shouldRecenter: boolean = true) => {
    setIsLoadingPosition(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentPosition(position);
          setIsLoadingPosition(false);
          toast.success('現在位置を取得しました');

          if (shouldRecenter) {
            // 地図の中心を現在位置に更新
            setMapState({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              zoom: 14,
            });
          }
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
      // shouldRecenter is false if focusedDestination is present
      getCurrentPosition(!focusedDestination);
    }, 0);
    return () => clearTimeout(timer);
  }, [focusedDestination]);

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
          onClick={() => getCurrentPosition(true)}
          disabled={isLoadingPosition}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Navigation className="w-4 h-4" />
          {isLoadingPosition ? (
            <span className="inline-flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              取得中...
            </span>
          ) : (
            '現在位置を更新'
          )}
        </Button>
      </div>

      {/* Map Container */}
      <Card className="relative bg-white/80 backdrop-blur-sm overflow-hidden">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={{ lat: mapState.lat, lng: mapState.lng }}
          zoom={mapState.zoom}
          onLoad={() => setMapLoaded(false)}
          onTilesLoaded={() => setMapLoaded(true)}
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
                // onDestinationClick is NOT called here anymore
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

          {/* ... (Current position marker logic omitted) ... */}

          {/* 選択された目的地の情報ウィンドウ */}
          {selectedDestination && (
            <InfoWindow
              position={{
                lat: selectedDestination.latitude,
                lng: selectedDestination.longitude,
              }}
              onCloseClick={() => setSelectedDestination(null)}
            >
              <div
                className="p-2 bg-white rounded cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onDestinationClick(selectedDestination)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-sm text-gray-900">{selectedDestination.name}</h3>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5">詳細を見る</Badge>
                </div>
                <p className="text-xs text-gray-600">{selectedDestination.address}</p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* Map tiles loading overlay */}
        {!mapLoaded && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70">
            <div className="flex items-center gap-3 p-4 rounded-md bg-white/90 shadow">
              <svg className="w-6 h-6 text-gray-700 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span className="text-sm text-gray-800">マップの描画を読み込み中...</span>
            </div>
          </div>
        )}

        {/* Destination Count */}
        <div className="absolute top-3 right-16 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-4 py-2 border border-gray-200 z-10">
          <p className="text-sm text-gray-600">
            目的地: <span className="text-gray-900">{destinations.length}</span>件
          </p>
        </div>
      </Card>


    </div>
  );
}

export function MapView({ destinations, onDestinationClick, focusedDestination }: MapViewProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  if (!isLoaded) {
    return (
      <Card className="relative bg-white/80 backdrop-blur-sm overflow-hidden h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-6 h-6 text-gray-500 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <p className="text-gray-500">マップを読み込み中...</p>
        </div>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card className="relative bg-white/80 backdrop-blur-sm overflow-hidden h-[400px] flex items-center justify-center">
        <p className="text-red-500">マップの読み込みに失敗しました</p>
      </Card>
    );
  }

  return <MapViewContent destinations={destinations} onDestinationClick={onDestinationClick} focusedDestination={focusedDestination} />;
}
