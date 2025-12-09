"use client";

import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

export interface PlaceResult {
  placeId?: string | null;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  raw?: any;
}

interface Props {
  value?: string;
  onChange?: (v: string) => void;
  onSelect: (place: PlaceResult) => void;
  placeholder?: string;
  disabled?: boolean;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function PlaceSearchInput({
  value,
  onChange,
  onSelect,
  placeholder = "場所を検索",
  disabled = false,
}: Props) {
  const [internalValue, setInternalValue] = useState(value ?? "");
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [placesLibLoaded, setPlacesLibLoaded] = useState(false);
  const [predictions, setPredictions] = useState<
    Array<{ description: string; placeId?: string; suggestion?: any }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placesLibraryRef = useRef<any>(null);
  const sessionTokenRef = useRef<any>(null);
  const debounceRef = useRef<number | null>(null);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);

  useEffect(() => {
    if (value !== undefined && value !== internalValue) setInternalValue(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Try to import the new places library after maps script load; otherwise fall back
  useEffect(() => {
    if (!mapsLoaded) return;

    let mounted = true;
    (async () => {
      try {
        if (window.google?.maps?.importLibrary) {
          const lib = await window.google.maps.importLibrary("places");
          if (!mounted) return;
          placesLibraryRef.current = lib;
          setPlacesLibLoaded(true);
          return;
        }

        // Legacy: if places loaded via libraries=places, expose parts via google.maps.places
        if (window.google?.maps?.places) {
          autocompleteServiceRef.current =
            new window.google.maps.places.AutocompleteService();
          // PlacesService requires an HTMLDivElement; create a dummy element if needed
          const div = document.createElement("div");
          placesServiceRef.current =
            new window.google.maps.places.PlacesService(div);
          setPlacesLibLoaded(true);
          return;
        }

        // If neither available, keep placesLibLoaded false and let search show error
      } catch (err) {
        console.error("PlaceSearchInput importLibrary error", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [mapsLoaded]);

  // Debounced search
  useEffect(() => {
    if (!placesLibLoaded) return;
    if (!internalValue) {
      setPredictions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(async () => {
      try {
        setError(null);
        // New API
        if (placesLibraryRef.current) {
          const { AutocompleteSessionToken, AutocompleteSuggestion } =
            placesLibraryRef.current;
          if (!sessionTokenRef.current)
            sessionTokenRef.current = new AutocompleteSessionToken();

          const req: any = {
            input: internalValue,
            sessionToken: sessionTokenRef.current,
          };
          const res =
            await AutocompleteSuggestion.fetchAutocompleteSuggestions(req);
          const suggestions = res?.suggestions || [];
          const mapped = suggestions.map((s: any) => {
            const pred = s.placePrediction;
            const description =
              pred?.description?.text ||
              pred?.text?.text ||
              s.displayText ||
              (pred && JSON.stringify(pred).slice(0, 120)) ||
              internalValue;
            return { description, placeId: pred?.placeId, suggestion: s };
          });
          setPredictions(mapped);
          return;
        }

        // Legacy API fallback
        if (autocompleteServiceRef.current) {
          autocompleteServiceRef.current.getPlacePredictions(
            {
              input: internalValue,
              sessionToken: sessionTokenRef.current ?? undefined,
            },
            (preds: any[]) => {
              const mapped = (preds || []).map((p: any) => ({
                description: p.description,
                placeId: p.place_id,
              }));
              setPredictions(mapped);
            },
          );
          return;
        }

        setError("Places ライブラリが利用できません。");
        setPredictions([]);
      } catch (err) {
        console.error("search error", err);
        setError("検索時にエラーが発生しました");
        setPredictions([]);
      } finally {
        setIsSearching(false);
      }
    }, 280) as unknown as number;

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [internalValue, placesLibLoaded]);

  const handleSelectPrediction = async (item: {
    description: string;
    placeId?: string;
    suggestion?: any;
  }) => {
    setIsSearching(true);
    setError(null);

    try {
      // New API path
      if (placesLibraryRef.current && item.suggestion) {
        const placePrediction = item.suggestion.placePrediction;
        if (!placePrediction)
          throw new Error("選択した候補の場所情報がありません");

        const placeObj = placePrediction.toPlace();
        await placeObj.fetchFields({
          fields: ["displayName", "formattedAddress", "location"],
        });

        const displayName =
          placeObj.displayName?.text ||
          placeObj.displayName ||
          item.description ||
          "";
        const formattedAddress =
          placeObj.formattedAddress || item.description || "";
        const lat = placeObj.location?.lat ?? placeObj.location?.latitude ?? 0;
        const lng = placeObj.location?.lng ?? placeObj.location?.longitude ?? 0;

        const res: PlaceResult = {
          placeId: placePrediction.placeId || undefined,
          name: typeof displayName === "function" ? displayName() : displayName,
          address:
            typeof formattedAddress === "function"
              ? formattedAddress()
              : formattedAddress,
          latitude: typeof lat === "function" ? Number(lat()) : Number(lat),
          longitude: typeof lng === "function" ? Number(lng()) : Number(lng),
          raw: placeObj,
        };

        sessionTokenRef.current = null;
        onSelect(res);
        setInternalValue(res.address || res.name);
        setPredictions([]);
        return;
      }

      // Legacy path using PlacesService.getDetails
      if (placesServiceRef.current && item.placeId) {
        const req = {
          placeId: item.placeId,
          fields: ["name", "formatted_address", "geometry"],
        };
        placesServiceRef.current.getDetails(req, (place: any, status: any) => {
          if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
            setError("場所の詳細取得に失敗しました");
            setIsSearching(false);
            return;
          }
          const lat =
            place.geometry?.location?.lat?.() ??
            place.geometry?.location?.lat ??
            place.geometry?.location?.latitude ??
            0;
          const lng =
            place.geometry?.location?.lng?.() ??
            place.geometry?.location?.lng ??
            place.geometry?.location?.longitude ??
            0;

          const res: PlaceResult = {
            placeId: item.placeId,
            name: place.name || item.description || "",
            address: place.formatted_address || item.description || "",
            latitude: Number(lat),
            longitude: Number(lng),
            raw: place,
          };

          onSelect(res);
          setInternalValue(res.address || res.name);
          setPredictions([]);
          setIsSearching(false);
        });
        return;
      }

      setError("場所情報の取得に失敗しました");
    } catch (err) {
      console.error("handleSelectPrediction error", err);
      setError("場所情報の処理に失敗しました");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&v=weekly&language=ja&libraries=places`}
        strategy="lazyOnload"
        onLoad={() => setMapsLoaded(true)}
      />

      <div className="relative">
        <div className="flex gap-2">
          <Input
            value={internalValue}
            onChange={(e) => {
              setInternalValue(e.target.value);
              if (onChange) onChange(e.target.value);
            }}
            placeholder={placeholder}
            disabled={disabled || !placesLibLoaded}
            onKeyDown={(e) => {
              if (e.key === "Enter" && predictions.length)
                handleSelectPrediction(predictions[0]);
            }}
          />
          <Button
            onClick={() =>
              predictions.length && handleSelectPrediction(predictions[0])
            }
            disabled={!internalValue || isSearching || !placesLibLoaded}
            className="gap-2"
          >
            {isSearching ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                検索中
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                検索
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-2 p-2 rounded bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {internalValue && predictions.length > 0 && (
          <div className="absolute left-0 right-0 mt-2 z-50 bg-white border rounded-lg shadow max-h-64 overflow-y-auto">
            {predictions.map((p, i) => (
              <button
                key={p.placeId || i}
                onClick={() => handleSelectPrediction(p)}
                className="w-full text-left p-3 border-b last:border-b-0 hover:bg-gray-50"
                type="button"
              >
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{p.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
