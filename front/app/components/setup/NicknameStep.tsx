import { User } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';

interface NicknameStepProps {
  nickname: string;
  setNickname: (nickname: string) => void;
}

export function NicknameStep({ nickname, setNickname }: NicknameStepProps) {
  return (
    <div className="w-full max-w-lg mx-auto">
      <Card className="p-8 bg-white/80 backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-gray-900 mb-2">ニックネームを教えてください</h2>
          <p className="text-gray-600">アプリ内で表示される名前です</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nickname">ニックネーム</Label>
          <Input
            id="nickname"
            type="text"
            placeholder="例: 冒険者"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            className="text-center text-lg py-6"
            autoFocus
          />
          <p className="text-xs text-gray-500 text-center">
            {nickname.length} / 20文字
          </p>
        </div>
      </Card>
    </div>
  );
}
