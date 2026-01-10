"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useJsApiLoader, GoogleMap, Marker } from "@react-google-maps/api";

export interface MapMarker {
  id?: string | number;
  lat: number;
  lng: number;
  title?: string;
  onClick?: () => void;
  icon?: any;
}

interface EmbeddedMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  height?: string; // tailwind class like 'h-48'
  showCurrent?: boolean;
  onLoad?: () => void;
  onTilesLoaded?: () => void;
  children?: React.ReactNode;
}

export default function EmbeddedMap({
  center = { lat: 35.681236, lng: 139.767125 },
  zoom = 14,
  markers = [],
  height = "h-48",
  showCurrent = false,
  onLoad,
  onTilesLoaded,
  children,
}: EmbeddedMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  const memoCenter = useMemo(
    () => ({ lat: center.lat, lng: center.lng }),
    [center.lat, center.lng],
  );
  const [currentPos, setCurrentPos] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    if (!showCurrent) return;
    if (!navigator?.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setCurrentPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (err) => console.warn("EmbeddedMap geolocation failed", err),
    );
  }, [showCurrent]);

  if (loadError) {
    return (
      <div
        className={`w-full ${height} bg-gray-100 rounded-lg flex items-center justify-center text-sm text-red-600`}
      >
        地図の読み込みに失敗しました
      </div>
    );
  }

  return (
    <div
      className={`w-full ${height} rounded-lg overflow-hidden border bg-gray-50 relative`}
    >
      {!isLoaded && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/60">
          <div
            className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"
            aria-hidden
          />
          <p className="mt-2 text-sm text-gray-700">地図を読み込み中…</p>
        </div>
      )}

      {isLoaded && (
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={memoCenter}
          zoom={zoom}
          onLoad={() => onLoad && onLoad()}
          onTilesLoaded={() => onTilesLoaded && onTilesLoaded()}
          options={{
            fullscreenControl: false,
            streetViewControl: false,
            mapTypeControl: false,
          }}
        >
          {markers.map((m) => (
            <Marker
              key={m.id ?? `${m.lat}-${m.lng}-${m.title}`}
              position={{ lat: m.lat, lng: m.lng }}
              title={m.title}
              onClick={() => m.onClick && m.onClick()}
              icon={m.icon}
            />
          ))}

          {currentPos && (
            <Marker
              position={currentPos}
              icon={
                (window as any).google && (window as any).google.maps
                  ? {
                      path: (window as any).google.maps.SymbolPath.CIRCLE,
                      scale: 8,
                      fillColor: "#22c55e",
                      fillOpacity: 1,
                      strokeColor: "#ffffff",
                      strokeWeight: 3,
                    }
                  : undefined
              }
            />
          )}
          {children}
        </GoogleMap>
      )}
    </div>
  );
}
