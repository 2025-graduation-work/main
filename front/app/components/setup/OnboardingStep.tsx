import { MapPin, Sparkles, TrendingUp } from 'lucide-react';
import { Card } from '@/app/components/ui/card';

export function OnboardingStep() {
  return (
    <div className="w-full max-w-2xl mx-auto text-center">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-3 bg-white/80 backdrop-blur-sm">
          <MapPin className="w-7 h-7 text-indigo-600 mx-auto mb-1.5" />
          <h3 className="text-sm font-semibold text-gray-900 mb-0.5">目的地を決める</h3>
          <p className="text-xs text-gray-600 leading-tight">
            行きたい場所を地図から選んで登録します
          </p>
        </Card>

        <Card className="p-3 bg-white/80 backdrop-blur-sm">
          <Sparkles className="w-7 h-7 text-purple-600 mx-auto mb-1.5" />
          <h3 className="text-sm font-semibold text-gray-900 mb-0.5">頻度を設定</h3>
          <p className="text-xs text-gray-600 leading-tight">
            週に何回、いつ訪れるかを自由に決められます
          </p>
        </Card>

        <Card className="p-3 bg-white/80 backdrop-blur-sm">
          <TrendingUp className="w-7 h-7 text-pink-600 mx-auto mb-1.5" />
          <h3 className="text-sm font-semibold text-gray-900 mb-0.5">習慣化する</h3>
          <p className="text-xs text-gray-600 leading-tight">
            継続することで、新しい発見と体験が積み重なります
          </p>
        </Card>
      </div>
    </div>
  );
}
