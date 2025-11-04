import { CheckCircle2, Sparkles } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface CompletionStepProps {
  nickname: string;
}

export function CompletionStep({ nickname }: CompletionStepProps) {
  return (
    <div className="w-full max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <div className="relative w-32 h-32 mx-auto mb-6">
          <div className="w-32 h-32 bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
            <CheckCircle2 className="w-16 h-16 text-white" />
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles className="w-10 h-10 text-yellow-400 animate-pulse" />
          </div>
        </div>
        <h2 className="text-gray-900 mb-4">
          {nickname}さん、準備完了です！
        </h2>
        <p className="text-gray-700 max-w-lg mx-auto leading-relaxed">
          これから「どこかへ行く体験」を習慣化していきましょう。
          <br />
          小さな一歩から、大きな変化が生まれます。
        </p>
      </div>

      <Card className="p-8 bg-white/80 backdrop-blur-sm overflow-hidden">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1469474968028-56623f02e42e"
          alt="Adventure"
          className="w-full h-64 object-cover rounded-lg mb-6"
        />
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-left">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-indigo-600">1</span>
            </div>
            <div>
              <p className="text-gray-900">目的地を確認</p>
              <p className="text-sm text-gray-600">設定した場所と頻度をチェックしましょう</p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-left">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-purple-600">2</span>
            </div>
            <div>
              <p className="text-gray-900">実際に訪れる</p>
              <p className="text-sm text-gray-600">決めた日時に目的地へ向かいましょう</p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-left">
            <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-pink-600">3</span>
            </div>
            <div>
              <p className="text-gray-900">体験を楽しむ</p>
              <p className="text-sm text-gray-600">新しい発見や気づきを大切に</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
