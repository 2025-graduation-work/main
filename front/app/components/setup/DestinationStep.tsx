'use client';

import Script from 'next/script';
import { MapPin, Search } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { useEffect, useRef, useState } from 'react';
import { Destination } from '@/app/lib/types';

interface DestinationStepProps {
  destination: Omit<Destination, 'id' | 'createdAt'> | null;
  setDestination: (destination: Omit<Destination, 'id' | 'createdAt'> | null) => void;
}

interface SuggestionItem {
  // we'll store the full suggestion object returned by the new Places library
  suggestion: any;
  description: string;
  placeId?: string;
}

declare global {
  interface Window {
    google: any;
    initMap?: () => void;
  }
}

export function DestinationStep({ destination, setDestination }: DestinationStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<SuggestionItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [placesLibLoaded, setPlacesLibLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const googleMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const sessionTokenRef = useRef<any>(null);
  const debounceRef = useRef<number | null>(null);
  const placesLibraryRef = useRef<any>(null); // will hold imported places classes

  // 1) Script onLoad=> setMapsLoaded(true)  (Script is loaded without libraries=places)
  // 2) Once mapsLoaded, import places library via google.maps.importLibrary("places")
  useEffect(() => {
    if (!mapsLoaded) return;

    let mounted = true;
    (async () => {
      if (!window.google || !window.google.maps || !window.google.maps.importLibrary) {
        console.error('google.maps.importLibrary is not available');
        return;
      }

      try {
        // import places library (new)
        const lib: google.maps.PlacesLibrary = await window.google.maps.importLibrary('places');
        if (!mounted) return;
        placesLibraryRef.current = lib;
        setPlacesLibLoaded(true);
      } catch (err) {
        console.error('importLibrary(places) failed', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [mapsLoaded]);

  // initialize map (since you chose to use map)
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || googleMapRef.current) return;
    // create map (minimal)
    googleMapRef.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 35.681236, lng: 139.767125 },
      zoom: 14,
      // mapId: 'YOUR_MAP_ID_IF_ANY', // optional: use if you created a MapID
    });
  }, [mapsLoaded]);

  // handle user typing -> call new autocomplete suggestions
  useEffect(() => {
    if (!placesLibLoaded) return;
    if (!searchQuery) {
      setPredictions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(async () => {
      try {
        const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLibraryRef.current;

        // create a new session token if none exists for this typing session
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new AutocompleteSessionToken();
        }

        // build request (adjust options as needed)
        const req: any = {
          input: searchQuery,
          // optional restrictions / biases:
          // language: 'ja',
          // region: 'jp',
          // locationRestriction: { west: ..., north: ..., east: ..., south: ... },
          sessionToken: sessionTokenRef.current,
        };

        // fetch suggestions (new API)
        const result = await AutocompleteSuggestion.fetchAutocompleteSuggestions(req);
        const suggestions = result?.suggestions || [];

        const mapped: SuggestionItem[] = suggestions.map((s: any) => {
          const pred = s.placePrediction;
          // description: prefer the display text (if available) or fallback to text snippet
          const description =
            (pred?.description?.text) ||
            (pred?.text?.text) ||
            (s?.displayText) ||
            JSON.stringify(pred).slice(0, 80);
          return {
            suggestion: s,
            description,
            placeId: pred?.placeId || undefined,
          };
        });

        setPredictions(mapped);
      } catch (err) {
        console.error('fetchAutocompleteSuggestions error', err);
        setPredictions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300) as unknown as number;

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, placesLibLoaded]);

  // when user selects a prediction, convert to Place and fetch fields
  const selectPrediction = async (item: SuggestionItem) => {
    if (!placesLibLoaded) return;
    setIsSearching(true);

    try {
      const { AutocompleteSessionToken } = placesLibraryRef.current;
      const suggestion = item.suggestion;

      // If suggestion has placePrediction with toPlace(), use it
      const placePrediction = suggestion?.placePrediction;
      if (!placePrediction) {
        console.error('No placePrediction available on suggestion', suggestion);
        setIsSearching(false);
        return;
      }

      // Convert prediction -> Place object
      const placeObj = placePrediction.toPlace();

      // fetch required fields (this ends the session per docs)
      await placeObj.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location'], // adjust fields you need
      });

      // placeObj now contains the requested fields
      const displayName = placeObj.displayName?.text || placeObj.displayName || item.description;
      const formattedAddress = placeObj.formattedAddress || item.description;
      const lat = placeObj.location?.lat || placeObj.location?.latitude || 0;
      const lng = placeObj.location?.lng || placeObj.location?.longitude || 0;

      // set destination to parent component
      setDestination({
        name: displayName,
        address: formattedAddress,
        latitude: typeof lat === 'function' ? lat() : lat, // handle legacy getters if present
        longitude: typeof lng === 'function' ? lng() : lng,
        frequency: { days: [], time: '10:00' },
      });

      // update UI state
      setSearchQuery(formattedAddress);
      setPredictions([]);

      // show marker on map if map exists
      if (googleMapRef.current) {
        const pos = { lat: Number(typeof lat === 'function' ? lat() : lat), lng: Number(typeof lng === 'function' ? lng() : lng) };
        if (markerRef.current) {
          markerRef.current.setPosition(pos);
        } else {
          markerRef.current = new window.google.maps.Marker({
            map: googleMapRef.current,
            position: pos,
          });
        }
        googleMapRef.current.panTo(pos);
        googleMapRef.current.setZoom(15);
      }

      // end the session token (docs: fetchFields ends session). create a fresh token for next session
      sessionTokenRef.current = null;
    } catch (err) {
      console.error('selectPrediction error', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Load Maps JS without libraries=places */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&v=weekly&language=ja`}
        strategy="lazyOnload"
        onLoad={() => {
          // safe flag to start importLibrary
          setMapsLoaded(true);
        }}
      />

      <Card className="p-8 bg-white/80 backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-gray-900 mb-2">最初の目的地を設定しましょう</h2>
          <p className="text-gray-600">Google Places（新API）で場所を検索して選択してください</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">場所を検索</Label>
            <div className="flex gap-2 relative">
              <Input
                id="search"
                type="text"
                placeholder="例: 新宿御苑"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && predictions.length && selectPrediction(predictions[0])}
              />
              <Button
                onClick={() => predictions.length && selectPrediction(predictions[0])}
                disabled={!searchQuery || isSearching}
                className="gap-2"
              >
                <Search className="w-4 h-4" />
                検索
              </Button>
            </div>
            <p className="text-xs text-gray-500">（新API）Place Autocomplete Data API を使用しています</p>
          </div>

          {searchQuery && predictions.length > 0 && (
            <div className="space-y-2">
              <Label>検索結果</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {predictions.map((p, i) => (
                  <button
                    key={p.placeId || i}
                    onClick={() => selectPrediction(p)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      destination?.address === p.description
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-gray-900">{p.description}</p>
                        <p className="text-sm text-gray-600">{/* no secondary text in this mapping */}</p>
                      </div>
                      {destination && destination.address === p.description && <Badge className="bg-indigo-600">選択中</Badge>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {destination && (
            <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 mb-1">{destination.name}</p>
                  <p className="text-sm text-gray-600">{destination.address}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </Card>

      {/* Map container (since you wanted a map) */}
      <div className="mt-4 w-full h-64 rounded-lg overflow-hidden border" ref={mapRef} />

    </div>
  );
}
