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
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
            <MapPin className="w-16 h-16 text-white" />
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

