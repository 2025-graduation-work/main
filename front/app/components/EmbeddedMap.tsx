"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useJsApiLoader, GoogleMap, Marker } from '@react-google-maps/api';

interface EmbeddedMapProps {
  lat: number;
  lng: number;
  height?: string; // tailwind class like 'h-48'
  zoom?: number;
  showCurrent?: boolean;
}

export default function EmbeddedMap({ lat, lng, height = 'h-48', zoom = 15, showCurrent = true }: EmbeddedMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  const center = useMemo(() => ({ lat, lng }), [lat, lng]);
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!showCurrent) return;
    if (!navigator?.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setCurrentPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (err) => console.warn('EmbeddedMap geolocation failed', err),
    );
  }, [showCurrent]);

  if (loadError) {
    return (
      <div className={`w-full ${height} bg-gray-100 rounded-lg flex items-center justify-center text-sm text-red-600`}>
        地図の読み込みに失敗しました
      </div>
    );
  }

  return (
    <div className={`w-full ${height} rounded-lg overflow-hidden border bg-gray-50 relative`}>
      {!isLoaded && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/60">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" aria-hidden />
          <p className="mt-2 text-sm text-gray-700">地図を読み込み中…</p>
        </div>
      )}

      {isLoaded && (
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={center}
          zoom={zoom}
          options={{ fullscreenControl: false, streetViewControl: false, mapTypeControl: false }}
        >
          <Marker position={center} />
          {currentPos && (
            <Marker
              position={currentPos}
              icon={
                // use google symbol if available, otherwise fall back to default
                (window as any).google && (window as any).google.maps
                  ? {
                      path: (window as any).google.maps.SymbolPath.CIRCLE,
                      scale: 8,
                      fillColor: '#22c55e',
                      fillOpacity: 1,
                      strokeColor: '#ffffff',
                      strokeWeight: 3,
                    }
                  : undefined
              }
            />
          )}
        </GoogleMap>
      )}
    </div>
  );
}
