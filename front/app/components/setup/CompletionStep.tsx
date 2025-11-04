import { CheckCircle2 } from 'lucide-react';

interface CompletionStepProps {
  nickname: string;
}

export function CompletionStep({ nickname }: CompletionStepProps) {
  return (
    <div className="w-full max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <div className="relative w-32 h-32 mx-auto mb-6">
          <div className="w-32 h-32 bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl">
            <CheckCircle2 className="w-16 h-16 text-white" />
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
    </div>
  );
}
