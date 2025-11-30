import { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Slider } from '@/app/components/ui/slider';
import { toast } from 'sonner';
import { Location } from '@/app/lib/types';

interface AddLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (location: Omit<Location, 'id' | 'createdAt'>) => void;
  currentPosition: GeolocationPosition | null;
}

export function AddLocationDialog({
  open,
  onOpenChange,
  onAdd,
  currentPosition,
}: AddLocationDialogProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState([50]);

  const useCurrentLocation = () => {
    if (currentPosition) {
      setLatitude(currentPosition.coords.latitude.toString());
      setLongitude(currentPosition.coords.longitude.toString());
      toast.success('現在位置を設定しました');
    } else {
      toast.error('現在位置が取得されていません');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !latitude || !longitude) {
      toast.error('すべての必須項目を入力してください');
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      toast.error('正しい緯度・経度を入力してください');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error('緯度・経度の値が範囲外です');
      return;
    }

    onAdd({
      name,
      address: address || '住所未設定',
      latitude: lat,
      longitude: lng,
      radius: radius[0],
    });

    // Reset form
    setName('');
    setAddress('');
    setLatitude('');
    setLongitude('');
    setRadius([50]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>場所を追加</DialogTitle>
          <DialogDescription>
            訪れる場所を登録します。現在位置または手動で座標を入力してください。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">場所の名前 *</Label>
              <Input
                id="name"
                placeholder="例: 近所の公園"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">住所・説明（任意）</Label>
              <Input
                id="address"
                placeholder="例: 〇〇町1-2-3"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">緯度 *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="35.6812"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">経度 *</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="139.7671"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={useCurrentLocation}
              className="w-full gap-2"
              disabled={!currentPosition}
            >
              <Navigation className="w-4 h-4" />
              現在位置を使用
            </Button>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>到達範囲</Label>
                <span className="text-sm text-gray-600">{radius[0]}m</span>
              </div>
              <Slider
                value={radius}
                onValueChange={setRadius}
                min={10}
                max={500}
                step={10}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                この距離以内に近づくとチェックインできます
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit" className="gap-2">
              <MapPin className="w-4 h-4" />
              追加
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
