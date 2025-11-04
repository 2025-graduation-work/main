import { MapPin, Sparkles, TrendingUp } from 'lucide-react';
import { Card } from '@/app/components/ui/card';

export function OnboardingStep() {
  return (
    <div className="w-full max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
          <MapPin className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-gray-900 mb-4">
          「どこかへ行く」を習慣にしよう
        </h2>
        <p className="text-gray-700 max-w-xl mx-auto leading-relaxed">
          このアプリでは、あなたが訪れたい場所と頻度を設定することで、
          日常に小さな冒険を取り入れることができます。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-white/80 backdrop-blur-sm">
          <MapPin className="w-10 h-10 text-indigo-600 mx-auto mb-3" />
          <h3 className="text-gray-900 mb-2">目的地を決める</h3>
          <p className="text-sm text-gray-600">
            行きたい場所を地図から選んで登録します
          </p>
        </Card>

        <Card className="p-6 bg-white/80 backdrop-blur-sm">
          <Sparkles className="w-10 h-10 text-purple-600 mx-auto mb-3" />
          <h3 className="text-gray-900 mb-2">頻度を設定</h3>
          <p className="text-sm text-gray-600">
            週に何回、いつ訪れるかを自由に決められます
          </p>
        </Card>

        <Card className="p-6 bg-white/80 backdrop-blur-sm">
          <TrendingUp className="w-10 h-10 text-pink-600 mx-auto mb-3" />
          <h3 className="text-gray-900 mb-2">習慣化する</h3>
          <p className="text-sm text-gray-600">
            継続することで、新しい発見と体験が積み重なります
          </p>
        </Card>
      </div>
    </div>
  );
}
