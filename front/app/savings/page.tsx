'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { userDataAtom } from '@/app/lib/store';
import { ArrowLeft, Coins, TrendingUp, Wallet, MinusCircle, History } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function SavingsPage() {
  const router = useRouter();
  const [userData, setUserData] = useAtom(userDataAtom);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  if (!userData) {
    return null;
  }

  const currentSavings = userData.savings || 0;

  // Calculate total lifetime earnings based on visits
  // Assuming strict 500 yen per visit for now
  const totalEarned = (userData.visits?.length || 0) * 500;

  const handleWithdraw = () => {
    const amount = parseInt(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('有効な金額を入力してください');
      return;
    }
    if (amount > currentSavings) {
      toast.error('貯金額が不足しています');
      return;
    }

    setUserData({
      ...userData,
      savings: currentSavings - amount,
    });

    toast.success(`${amount}円を使いました！`);
    setIsWithdrawDialogOpen(false);
    setWithdrawAmount('');
  };

  const getDestinationName = (id: string) => {
    return userData.destinations.find((d) => d.id === id)?.name || '削除された目的地';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="-ml-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2">
            <Coins className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-bold text-gray-900">趣味貯金</h1>
          </div>
        </div>

        {/* Main Card */}
        <Card className="p-8 mb-8 bg-white border-none shadow-lg rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Coins className="w-32 h-32" />
          </div>

          <div className="relative z-10">
            <p className="text-gray-500 font-medium mb-1">現在の貯金額</p>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl font-bold text-gray-900 tracking-tight">
                ¥{currentSavings.toLocaleString()}
              </span>
              <span className="text-gray-500">円</span>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => setIsWithdrawDialogOpen(true)}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white gap-2"
                size="lg"
              >
                <Wallet className="w-5 h-5" />
                使う
              </Button>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="p-4 bg-white/60">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">累計獲得額</span>
            </div>
            <p className="text-xl font-bold text-gray-900">¥{totalEarned.toLocaleString()}</p>
          </Card>
          <Card className="p-4 bg-white/60">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <History className="w-4 h-4" />
              <span className="text-sm">累計ついた回数</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{userData.visits?.length || 0}回</p>
          </Card>
        </div>

        {/* History List (Recent Check-ins) */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">最近の獲得履歴</h2>
          <div className="space-y-3">
            {[...(userData.visits || [])]
              .sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime())
              .map((visit) => (
                <Card key={visit.id} className="p-4 flex items-center justify-between bg-white border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <PlusCircleIcon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{getDestinationName(visit.destinationId)}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(visit.visitedAt), 'yyyy/MM/dd HH:mm', { locale: ja })}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-600">+500円</span>
                </Card>
              ))}

            {(!userData.visits || userData.visits.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                まだ履歴がありません
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Withdraw Dialog */}
      <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>貯金を使う</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>使用する金額</Label>
              <Input
                type="number"
                placeholder="金額を入力"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-gray-500">
                現在の残高: ¥{currentSavings.toLocaleString()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWithdrawDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleWithdraw} className="bg-amber-500 hover:bg-amber-600">
              使用する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Icon helper
function PlusCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}
