import { MapPin, Search } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { useState } from 'react';
import { Destination } from '../../pages/Setup';

interface DestinationStepProps {
  destination: Omit<Destination, 'id' | 'createdAt'> | null;
  setDestination: (destination: Omit<Destination, 'id' | 'createdAt'> | null) => void;
}

export function DestinationStep({ destination, setDestination }: DestinationStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // モックの検索結果（実際にはGoogle Maps APIを使用）
  const mockSearchResults = [
    { name: '新宿御苑', address: '東京都新宿区内藤町11', lat: 35.6851, lng: 139.7101 },
    { name: '代々木公園', address: '東京都渋谷区代々木神園町2-1', lat: 35.6719, lng: 139.6960 },
    { name: '上野公園', address: '東京都台東区上野公園5-20', lat: 35.7148, lng: 139.7743 },
  ];

  const handleSearch = () => {
    setIsSearching(true);
    // 実際にはGoogle Maps Places APIを呼び出す
    setTimeout(() => {
      setIsSearching(false);
    }, 500);
  };

  const selectPlace = (place: typeof mockSearchResults[0]) => {
    setDestination({
      name: place.name,
      address: place.address,
      latitude: place.lat,
      longitude: place.lng,
      frequency: { days: [], time: '10:00' }, // デフォルト値
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="p-8 bg-white/80 backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-gray-900 mb-2">最初の目的地を設定しましょう</h2>
          <p className="text-gray-600">Google Mapで場所を検索して選択してください</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">場所を検索</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                type="text"
                placeholder="例: 新宿御苑"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                onClick={handleSearch}
                disabled={!searchQuery || isSearching}
                className="gap-2"
              >
                <Search className="w-4 h-4" />
                検索
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              ※ 実装時はGoogle Maps Places APIが必要です
            </p>
          </div>

          {/* Search Results */}
          {searchQuery && (
            <div className="space-y-2">
              <Label>検索結果</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {mockSearchResults.map((place, index) => (
                  <button
                    key={index}
                    onClick={() => selectPlace(place)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      destination?.name === place.name
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-gray-900">{place.name}</p>
                        <p className="text-sm text-gray-600">{place.address}</p>
                      </div>
                      {destination?.name === place.name && (
                        <Badge className="bg-indigo-600">選択中</Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected Destination */}
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
    </div>
  );
}
