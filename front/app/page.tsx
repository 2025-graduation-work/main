'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { MapPin, Sparkles, Calendar } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // すでにセットアップ済みの場合はホームへ
    if (typeof window !== 'undefined') {
      const userData = sessionStorage.getItem('userData');
      if (userData) {
        router.push('/home');
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        {/* Hero Image */}
        <div className="mb-8 relative">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
            <MapPin className="w-16 h-16 text-white" />
          </div>
          <div className="absolute top-0 right-1/4 animate-bounce">
            <Sparkles className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        {/* Title & Description */}
        <div className="mb-12">
          <h1 className="text-gray-900 mb-4">
            「どこかへ行く体験」を<br />習慣にする
          </h1>
          <p className="text-gray-700 max-w-lg mx-auto leading-relaxed">
            毎日の生活に新しい発見を。
            <br />
            決めた場所へ、決めた頻度で訪れることで、
            <br />
            小さな冒険を習慣化しましょう。
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <MapPin className="w-10 h-10 text-indigo-600 mx-auto mb-3" />
            <h3 className="text-gray-900 mb-2">目的地を設定</h3>
            <p className="text-sm text-gray-600">行きたい場所を自由に登録</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <Calendar className="w-10 h-10 text-purple-600 mx-auto mb-3" />
            <h3 className="text-gray-900 mb-2">頻度を決める</h3>
            <p className="text-sm text-gray-600">自分のペースで続けられる</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <Sparkles className="w-10 h-10 text-pink-600 mx-auto mb-3" />
            <h3 className="text-gray-900 mb-2">体験を重ねる</h3>
            <p className="text-sm text-gray-600">小さな冒険を積み重ねる</p>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          size="lg"
          onClick={() => router.push('/setup')}
          className="px-12 py-6 text-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 shadow-xl"
        >
          はじめる
        </Button>
      </div>
    </div>
  );
}

