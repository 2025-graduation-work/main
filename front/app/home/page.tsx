'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { userDataAtom } from '@/app/lib/store';
import { Plus, Edit2, List, Map } from 'lucide-react';
import { Destination } from '@/app/lib/types';
import { DestinationCard } from '@/app/components/DestinationCard';
import { DestinationDetailModal } from '@/app/components/DestinationDetailModal';
import { AddDestinationDialog } from '@/app/components/AddDestinationDialog';
import { MapView } from '@/app/components/MapView';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';

export default function Home() {
  const router = useRouter();
  const [userData, setUserData] = useAtom(userDataAtom);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showNicknameDialog, setShowNicknameDialog] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showDebugModal, setShowDebugModal] = useState(false);

  useEffect(() => {
    if (!userData) {
      router.push('/setup');
    }
  }, [router, userData]);

  // デバッグモーダルのキーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        setShowDebugModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResetStorage = () => {
    // sessionStorageとlocalStorageをクリア
    sessionStorage.clear();
    localStorage.clear();
    setUserData(null);
    toast.success('ストレージをリセットしました');
    setShowDebugModal(false);
    router.push('/setup');
  };

  const addDestination = (destination: Omit<Destination, 'id' | 'createdAt'>) => {
    if (!userData) return;

    const newDestination: Destination = {
      ...destination,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    setUserData({
      ...userData,
      destinations: [...userData.destinations, newDestination],
    });
  };

  const updateDestination = (id: string, updates: Partial<Destination>) => {
    if (!userData) return;

    setUserData({
      ...userData,
      destinations: userData.destinations.map(dest =>
        dest.id === id ? { ...dest, ...updates } : dest
      ),
    });
  };

  const deleteDestination = (id: string) => {
    if (!userData) return;

    setUserData({
      ...userData,
      destinations: userData.destinations.filter(dest => dest.id !== id),
    });
    setSelectedDestination(null);
  };

  const handleNicknameChange = () => {
    if (!userData) return;
    
    if (!newNickname.trim()) {
      toast.error('ニックネームを入力してください');
      return;
    }

    setUserData({
      ...userData,
      nickname: newNickname.trim(),
    });
    
    setShowNicknameDialog(false);
    setNewNickname('');
    toast.success('ニックネームを変更しました');
  };

  const openNicknameDialog = () => {
    if (userData) {
      setNewNickname(userData.nickname);
      setShowNicknameDialog(true);
    }
  };

  if (!userData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <div className="max-w-6xl mx-auto p-6 pb-24">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-sm text-gray-600 mb-1">ようこそ、</p>
            <h1 className="text-gray-900">{userData.nickname} さん</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={openNicknameDialog}
            className="text-gray-600 hover:text-gray-900"
          >
            <Edit2 className="w-5 h-5" />
          </Button>
        </div>

        {/* View Toggle & Content */}
        {userData.destinations.length === 0 ? (
          <Card className="p-12 text-center bg-white/80 backdrop-blur-sm">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-10 h-10 text-indigo-600" />
              </div>
              <h2 className="text-gray-900 mb-2">目的地を追加しましょう</h2>
              <p className="text-gray-600 mb-6">
                訪れたい場所を登録して、習慣化の第一歩を踏み出しましょう。
              </p>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4" />
                目的地を追加
              </Button>
            </div>
          </Card>
        ) : (
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'map')} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
              <TabsTrigger value="list" className="gap-2">
                <List className="w-4 h-4" />
                リスト
              </TabsTrigger>
              <TabsTrigger value="map" className="gap-2">
                <Map className="w-4 h-4" />
                マップ
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userData.destinations.map((destination) => (
                  <DestinationCard
                    key={destination.id}
                    destination={destination}
                    onClick={() => setSelectedDestination(destination)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="map" className="mt-0">
              <MapView
                destinations={userData.destinations}
                onDestinationClick={(destination) => setSelectedDestination(destination)}
              />
            </TabsContent>
          </Tabs>
        )}

        {/* Add Button (FAB) */}
        {userData.destinations.length > 0 && (
          <div className="fixed bottom-8 right-8">
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              size="lg"
              className="rounded-full w-14 h-14 shadow-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        )}

        {/* Detail Modal */}
        {selectedDestination && (
          <DestinationDetailModal
            destination={selectedDestination}
            onClose={() => setSelectedDestination(null)}
            onUpdate={(updates) => updateDestination(selectedDestination.id, updates)}
            onDelete={() => deleteDestination(selectedDestination.id)}
          />
        )}

        {/* Add Destination Dialog */}
        <AddDestinationDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAdd={addDestination}
        />

        {/* Nickname Change Dialog */}
        <Dialog open={showNicknameDialog} onOpenChange={setShowNicknameDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>ニックネームを変更</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nickname">新しいニックネーム</Label>
                <Input
                  id="nickname"
                  type="text"
                  placeholder="例: 冒険者"
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                  maxLength={20}
                  onKeyDown={(e) => e.key === 'Enter' && handleNicknameChange()}
                  autoFocus
                />
                <p className="text-xs text-gray-500">
                  {newNickname.length} / 20文字
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowNicknameDialog(false);
                  setNewNickname('');
                }}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleNicknameChange}
                disabled={!newNickname.trim()}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                変更
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Debug Modal */}
        <Dialog open={showDebugModal} onOpenChange={setShowDebugModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>🐛 デバッグメニュー</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  開発用のデバッグツールです。ストレージをリセットして初期状態に戻すことができます。
                </p>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ 警告: すべてのデータが削除されます
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">現在のストレージ情報</h4>
                <div className="p-3 bg-gray-50 rounded-lg space-y-1 text-xs font-mono">
                  <p>ニックネーム: {userData?.nickname || 'なし'}</p>
                  <p>目的地数: {userData?.destinations.length || 0}</p>
                  <p>総チェックイン数: {
                    userData?.destinations.reduce((sum, d) => sum + (d.checkIns?.length || 0), 0) || 0
                  }</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDebugModal(false)}
              >
                閉じる
              </Button>
              <Button
                onClick={handleResetStorage}
                className="bg-red-600 hover:bg-red-700"
              >
                ストレージをリセット
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
