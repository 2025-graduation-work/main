'use client';

import Script from 'next/script';
import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Calendar, Clock, Dices } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Card } from '@/app/components/ui/card';
import { toast } from 'sonner';
import { Destination } from '@/app/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

interface AddDestinationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (destination: Omit<Destination, 'id' | 'createdAt'>) => void;
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

interface SuggestionItem {
  suggestion: any;
  description: string;
  placeId?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export function AddDestinationDialog({ open, onOpenChange, onAdd }: AddDestinationDialogProps) {
  const [step, setStep] = useState<'search' | 'frequency'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<{ name: string; address: string; lat: number; lng: number } | null>(null);
  const [frequency, setFrequency] = useState({ days: [] as number[], time: '10:00' });
  const [predictions, setPredictions] = useState<SuggestionItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [placesLibLoaded, setPlacesLibLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [radius, setRadius] = useState<string>('500');
  const sessionTokenRef = useRef<any>(null);
  const debounceRef = useRef<number | null>(null);
  const placesLibraryRef = useRef<any>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const googleMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Dialog が開いたら Google Maps API の状態をチェック
  useEffect(() => {
    if (!open) return;

    let mounted = true;

    // Google Maps API が既に読み込まれているかチェック
    const checkAndLoadPlaces = async () => {
      if (!mounted) return;

      if (window.google?.maps?.importLibrary) {
        setMapsLoaded(true);

        try {
          const lib: google.maps.PlacesLibrary = await window.google.maps.importLibrary('places');
          if (!mounted) return;
          placesLibraryRef.current = lib;
          setPlacesLibLoaded(true);

          // Places ライブラリ読み込み後、マップを初期化
          if (mapRef.current && !googleMapRef.current) {
            googleMapRef.current = new window.google.maps.Map(mapRef.current, {
              center: { lat: 35.681236, lng: 139.767125 },
              zoom: 14,
            });
            setIsMapReady(true);
          }
        } catch (err) {
          console.error('importLibrary(places) failed', err);
        }
      } else {
        // API がまだ読み込まれていない場合は少し待って再試行
        setTimeout(() => checkAndLoadPlaces(), 500);
      }
    };

    checkAndLoadPlaces();

    return () => {
      mounted = false;
    };
  }, [open]);

  // マップを初期化（予備）
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || googleMapRef.current) return;
    googleMapRef.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 35.681236, lng: 139.767125 },
      zoom: 14,
    });
    setIsMapReady(true);
  }, [mapsLoaded]);

  // ensureMap: マップDOMが消えているケースに備えて短時間ポーリングし、再生成する
  useEffect(() => {
    if (step !== 'search') return;
    if (!mapRef.current) return;
    let interval: number | null = null;

    const ensure = () => {
      const mapDiv = mapRef.current?.querySelector('.gm-style');
      if (googleMapRef.current && mapDiv) {
        // マップが既に存在し、DOMもある -> nothing
        return true;
      }
      if ((window as any).google?.maps) {
        // recreate map
        googleMapRef.current = new window.google.maps.Map(mapRef.current as HTMLDivElement, {
          center: { lat: 35.681236, lng: 139.767125 },
          zoom: 14,
        });
        setIsMapReady(true);

        // reattach marker if selectedPlace exists
        if (selectedPlace) {
          const pos = { lat: Number(selectedPlace.lat), lng: Number(selectedPlace.lng) };
          if (markerRef.current) {
            markerRef.current.setMap(googleMapRef.current);
            markerRef.current.setPosition(pos);
          } else {
            markerRef.current = new window.google.maps.Marker({ map: googleMapRef.current, position: pos });
          }
          googleMapRef.current.panTo(pos);
          googleMapRef.current.setZoom(15);
        }

        return true;
      }
      return false;
    };

    if (ensure()) return;
    interval = window.setInterval(() => {
      if (ensure() && interval !== null) {
        clearInterval(interval);
        interval = null;
      }
    }, 200) as unknown as number;

    return () => { if (interval !== null) clearInterval(interval); };
  }, [step, mapsLoaded, selectedPlace]);

  // 検索クエリが変更されたら Places API で候補を取得
  useEffect(() => {
    if (!placesLibLoaded || !searchQuery) {
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
        setError(null);
        const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLibraryRef.current;

        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new AutocompleteSessionToken();
        }

        const req: any = {
          input: searchQuery,
          sessionToken: sessionTokenRef.current,
        };

        const result = await AutocompleteSuggestion.fetchAutocompleteSuggestions(req);
        const suggestions = result?.suggestions || [];

        const mapped: SuggestionItem[] = suggestions.map((s: any) => {
          const pred = s.placePrediction;
          const description =
            pred?.description?.text ||
            pred?.text?.text ||
            s?.displayText ||
            JSON.stringify(pred).slice(0, 80);
          return {
            suggestion: s,
            description,
            placeId: pred?.placeId || undefined,
          };
        });

        setPredictions(mapped);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '検索に失敗しました。もう一度お試しください。';
        setError(errorMessage);
        setPredictions([]);
        console.error('fetchAutocompleteSuggestions error', err);
      } finally {
        setIsSearching(false);
      }
    }, 300) as unknown as number;

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [searchQuery, placesLibLoaded]);

  // 候補を選択して詳細情報を取得
  const selectPrediction = async (item: SuggestionItem) => {
    if (!placesLibLoaded) return;
    setIsSearching(true);
    setError(null);

    try {
      const placePrediction = item.suggestion?.placePrediction;
      if (!placePrediction) {
        setError('選択した場所の情報が見つかりません。');
        setIsSearching(false);
        return;
      }

      const placeObj = placePrediction.toPlace();
      await placeObj.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location'],
      });

      const displayName = placeObj.displayName?.text || placeObj.displayName || item.description;
      const formattedAddress = placeObj.formattedAddress || item.description;
      const lat = placeObj.location?.lat || placeObj.location?.latitude || 0;
      const lng = placeObj.location?.lng || placeObj.location?.longitude || 0;

      const latNum = typeof lat === 'function' ? lat() : lat;
      const lngNum = typeof lng === 'function' ? lng() : lng;

      setSelectedPlace({
        name: displayName,
        address: formattedAddress,
        lat: latNum,
        lng: lngNum,
      });

      setSearchQuery(formattedAddress);
      setPredictions([]);

      // マップにマーカーを表示
      if (googleMapRef.current) {
        const pos = { lat: Number(latNum), lng: Number(lngNum) };
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

      sessionTokenRef.current = null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '場所情報の取得に失敗しました。';
      setError(errorMessage);
      console.error('selectPrediction error', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRandomDestination = () => {
    if (!navigator.geolocation) {
      toast.error('このブラウザは位置情報をサポートしていません');
      return;
    }

    setIsSearching(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        const radiusMetres = parseInt(radius);
        let attempts = 0;
        const maxAttempts = 5;

        const searchRandomPlace = async (): Promise<void> => {
          if (attempts >= maxAttempts) {
            toast.error('周辺に適切な目的地が見つかりませんでした。');
            setIsSearching(false);
            return;
          }

          attempts++;

          // Generate random point within radius
          const r = radiusMetres * Math.sqrt(Math.random());
          const theta = Math.random() * 2 * Math.PI;

          const randomLat = lat + (r * Math.cos(theta)) / 111000;
          const randomLng = lng + (r * Math.sin(theta)) / (111000 * Math.cos(lat * Math.PI / 180));

          try {
            if (!googleMapRef.current) {
              // Should not happen if map is ready, but safety check
              throw new Error('Map not initialized');
            }

            const service = new window.google.maps.places.PlacesService(googleMapRef.current);
            const request = {
              location: { lat: randomLat, lng: randomLng },
              radius: 200, // Search within 200m of the random point
              type: 'point_of_interest' as any, // Broad category, can be specific
              // Use keyword or diverse types to ensure public places
              // Note: 'type' parameter in nearbySearch defines ONE type. 
              // Either use specific type or relying on POI.
            };

            // We can't pass multiple types in 'type' field in older API, but we can check results.
            // Let's try to search for something broad.

            service.nearbySearch({
              location: { lat: randomLat, lng: randomLng },
              radius: 500,
              type: 'point_of_interest' // This will return many things
            }, (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                // Filter results to ensure they are "passable" / public enough
                // Exclude some types if necessary?
                const validTypes = ['park', 'tourist_attraction', 'museum', 'store', 'restaurant', 'cafe', 'library', 'church', 'school', 'university', 'gym', 'zoo', 'aquarium', 'shopping_mall'];

                // Find first place that matches valid types or has a good rating/reviews
                const validPlace = results.find((p: google.maps.places.PlaceResult) =>
                  p.types?.some((t: string) => validTypes.includes(t)) || p.rating // simple heuristic
                );

                if (validPlace && validPlace.place_id) {
                  // Get full details for the place
                  const getDetails = async () => {
                    const detailsRequest = {
                      placeId: validPlace.place_id!,
                      fields: ['name', 'formatted_address', 'geometry']
                    };

                    service.getDetails(detailsRequest, (place: google.maps.places.PlaceResult | null, detailStatus: google.maps.places.PlacesServiceStatus) => {
                      if (detailStatus === window.google.maps.places.PlacesServiceStatus.OK && place && place.geometry && place.geometry.location) {
                        const name = place.name || '指定された地点';
                        const address = place.formatted_address || '';
                        const pLat = place.geometry.location.lat();
                        const pLng = place.geometry.location.lng();

                        const placeData = {
                          name: name,
                          address: address,
                          lat: pLat,
                          lng: pLng,
                        };

                        setSelectedPlace(placeData);
                        setSearchQuery(placeData.address);
                        setPredictions([]);

                        if (googleMapRef.current) {
                          const pos = { lat: pLat, lng: pLng };
                          if (markerRef.current) {
                            markerRef.current.setPosition(pos);
                          } else {
                            markerRef.current = new window.google.maps.Marker({
                              map: googleMapRef.current,
                              position: pos,
                            });
                          }
                          googleMapRef.current.panTo(pos);
                          googleMapRef.current.setZoom(16);
                        }
                        toast.success(`「${name}」が見つかりました！`);
                        setIsSearching(false);
                      } else {
                        // Failed to get details, try next random point
                        searchRandomPlace();
                      }
                    });
                  };
                  getDetails();
                } else {
                  // No valid place found in this random spot
                  searchRandomPlace();
                }
              } else {
                // No results at all
                searchRandomPlace();
              }
            });

          } catch (err) {
            console.error('Random destination search error:', err);
            // If error, try again
            searchRandomPlace();
          }
        };

        searchRandomPlace();
      },
      (err) => {
        console.error('Geolocation error:', err);
        toast.error('現在地の取得に失敗しました');
        setIsSearching(false);
      }
    );
  };

  const resetDialog = () => {
    setStep('search');
    setSearchQuery('');
    setSelectedPlace(null);
    setFrequency({ days: [], time: '10:00' });
    setPredictions([]);
    setError(null);

    // マップとマーカーをクリーンアップ
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
    if (googleMapRef.current) {
      googleMapRef.current = null;
    }

    // 状態をリセット
    setMapsLoaded(false);
    setPlacesLibLoaded(false);
    setIsMapReady(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetDialog();
    }
    onOpenChange(open);
  };

  const toggleDay = (day: number) => {
    const days = frequency.days.includes(day)
      ? frequency.days.filter(d => d !== day)
      : [...frequency.days, day].sort((a, b) => a - b);

    setFrequency({ ...frequency, days });
  };

  const handleAdd = () => {
    if (!selectedPlace) {
      toast.error('場所を選択してください');
      return;
    }
    if (frequency.days.length === 0) {
      toast.error('少なくとも1つの曜日を選択してください');
      return;
    }

    onAdd({
      name: selectedPlace.name,
      address: selectedPlace.address,
      latitude: selectedPlace.lat,
      longitude: selectedPlace.lng,
      frequency,
    });

    toast.success('目的地を追加しました');
    handleClose(false);
  };

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&v=weekly&language=ja`}
        strategy="lazyOnload"
        onLoad={() => setMapsLoaded(true)}
      />
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {step === 'search' ? '目的地を検索' : '頻度を設定'}
            </DialogTitle>
            <DialogDescription>
              {step === 'search'
                ? 'Google Maps から場所を検索して目的地を選択してください'
                : '選択した目的地への訪問頻度を設定してください'}
            </DialogDescription>
          </DialogHeader>

          {step === 'search' ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="add-search">場所を検索</Label>
                <div className="flex gap-2">
                  <Input
                    id="add-search"
                    type="text"
                    placeholder="例: 新宿御苑"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && predictions.length && selectPrediction(predictions[0])}
                    disabled={!placesLibLoaded}
                  />
                  <Button
                    onClick={() => predictions.length && selectPrediction(predictions[0])}
                    disabled={!searchQuery || isSearching || !placesLibLoaded}
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

                <div className="flex items-center gap-2 mt-2">
                  <Select value={radius} onValueChange={setRadius}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="検索半径" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="500">500m以内</SelectItem>
                      <SelectItem value="1000">1km以内</SelectItem>
                      <SelectItem value="3000">3km以内</SelectItem>
                      <SelectItem value="5000">5km以内</SelectItem>
                      <SelectItem value="10000">10km以内</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={handleRandomDestination}
                    disabled={!mapsLoaded || isSearching}
                    className="flex-1 gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    type="button"
                  >
                    <Dices className="w-4 h-4" />
                    ランダムに選ぶ
                  </Button>
                </div>
              </div>

              {/* エラーメッセージ */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-700">⚠️ {error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                  >
                    閉じる
                  </button>
                </div>
              )}

              {/* ローディング表示 */}
              {searchQuery && isSearching && predictions.length === 0 && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-blue-700">検索中...</p>
                </div>
              )}

              {searchQuery && predictions.length > 0 && (
                <div className="space-y-2">
                  <Label>検索結果</Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {predictions.map((item, index) => (
                      <button
                        key={item.placeId || index}
                        onClick={() => selectPrediction(item)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedPlace?.address === item.description
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 bg-white hover:border-indigo-300'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-gray-900">{item.description}</p>
                          </div>
                          {selectedPlace?.address === item.description && (
                            <Badge className="bg-indigo-600">選択中</Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* マップコンテナ */}
              <div className="relative">
                <div className="w-full h-64 rounded-lg overflow-hidden border" ref={mapRef} />
                {!isMapReady && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    <p className="mt-2 text-sm text-gray-700">マップを読み込み中…</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => handleClose(false)}>
                  キャンセル
                </Button>
                <Button
                  onClick={() => setStep('frequency')}
                  disabled={!selectedPlace}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  次へ
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {selectedPlace && (
                <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
                  <p className="text-sm text-gray-600 mb-1">追加する目的地</p>
                  <p className="text-gray-900">{selectedPlace.name}</p>
                </Card>
              )}

              <div className="space-y-3">
                <Label>曜日を選択</Label>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS.map((day) => {
                    const isSelected = frequency.days.includes(day.value);
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

              <div className="space-y-3">
                <Label htmlFor="add-time">時刻を選択</Label>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <Input
                    id="add-time"
                    type="time"
                    value={frequency.time}
                    onChange={(e) => setFrequency({ ...frequency, time: e.target.value })}
                    className="max-w-xs"
                  />
                </div>
              </div>

              <div className="flex justify-between gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep('search')}>
                  戻る
                </Button>
                <Button
                  onClick={handleAdd}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  追加
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
