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
  // 新しい Places ライブラリから返される候補オブジェクト全体を保持
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
  const [error, setError] = useState<string | null>(null);
  const [mapsLoadError, setMapsLoadError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const googleMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const sessionTokenRef = useRef<any>(null);
  const debounceRef = useRef<number | null>(null);
  const placesLibraryRef = useRef<any>(null); 

  // 1) Script の onLoad で setMapsLoaded(true) を呼ぶ（Script は libraries=places なしで読み込む）
  // 2) mapsLoaded になったら google.maps.importLibrary('places') で Places ライブラリをインポートする
  useEffect(() => {
    if (!mapsLoaded) return;

    let mounted = true;
    (async () => {
      if (!window.google || !window.google.maps || !window.google.maps.importLibrary) {
        console.error('google.maps.importLibrary is not available');
        return;
      }

      try {
        // Places ライブラリをインポート（新しい API）
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

  // マップを初期化（マップ表示を使用するため）
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || googleMapRef.current) return;
    // マップを作成（最小限の設定）
    googleMapRef.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 35.681236, lng: 139.767125 },
      zoom: 14,
    });
  }, [mapsLoaded]);

  // ユーザー入力を処理 -> 新しい Autocomplete 提案を呼び出す
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
        setError(null);
        const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLibraryRef.current;

        // このタイピングセッション用のセッショントークンがなければ新しく作成
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new AutocompleteSessionToken();
        }

        // リクエストを作成（必要に応じてオプションを調整）
        const req: any = {
          input: searchQuery,
          sessionToken: sessionTokenRef.current,
        };

        // 提案を取得（新しい API）
        const result = await AutocompleteSuggestion.fetchAutocompleteSuggestions(req);
        const suggestions = result?.suggestions || [];

        const mapped: SuggestionItem[] = suggestions.map((s: any) => {
          const pred = s.placePrediction;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, placesLibLoaded]);

  // ユーザーが候補を選択したとき、Place に変換してフィールドを取得
  const selectPrediction = async (item: SuggestionItem) => {
    if (!placesLibLoaded) return;
    setIsSearching(true);
    setError(null);

    try {
      const suggestion = item.suggestion;

      // suggestion に placePrediction と toPlace() があればそれを使用
      const placePrediction = suggestion?.placePrediction;
      if (!placePrediction) {
        setError('選択した場所の情報が見つかりません。');
        setIsSearching(false);
        return;
      }

      // 予測結果を Place オブジェクトに変換
      const placeObj = placePrediction.toPlace();

      // 必要なフィールドを取得（ドキュメントによればこの呼び出しでセッションは終了）
      await placeObj.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location'],
      });

      // placeObj に要求したフィールドが含まれている
      const displayName = placeObj.displayName?.text || placeObj.displayName || item.description;
      const formattedAddress = placeObj.formattedAddress || item.description;
      const lat = placeObj.location?.lat || placeObj.location?.latitude || 0;
      const lng = placeObj.location?.lng || placeObj.location?.longitude || 0;

      // 親コンポーネントに destination を設定
      setDestination({
        name: displayName,
        address: formattedAddress,
        latitude: typeof lat === 'function' ? lat() : lat, // handle legacy getters if present
        longitude: typeof lng === 'function' ? lng() : lng,
        frequency: { days: [], time: '10:00' },
      });

      // UI の状態を更新
      setSearchQuery(formattedAddress);
      setPredictions([]);

      // マップが存在する場合はマーカーを表示
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

      // セッショントークンを終了（fetchFields がセッションを終了するため）。次のセッション用に新しいトークンを作れるようにする
      sessionTokenRef.current = null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '場所情報の取得に失敗しました。';
      setError(errorMessage);
      console.error('selectPrediction error', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* libraries=places なしで Maps JS を読み込む */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&v=weekly&language=ja`}
        strategy="lazyOnload"
        onLoad={() => {
          // importLibrary を開始するための安全フラグ
          setMapsLoaded(true);
        }}
      />

      <Card className="p-8 bg-white/80 backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-gray-900 mb-2">最初の目的地を設定しましょう</h2>
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
                disabled={!placesLibLoaded || mapsLoaded === false}
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

          {/* ローディング表示（まだ候補なし） */}
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
                        <p className="text-sm text-gray-600">{/* このマッピングには補助テキストなし */}</p>
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

      {/* マップコンテナ（マップ表示を使用するため） */}
      <div className="mt-4 w-full h-64 rounded-lg overflow-hidden border" ref={mapRef} />

    </div>
  );
}
