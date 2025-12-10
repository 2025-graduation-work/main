'use client';

import React, { useEffect } from 'react';
import { Provider } from 'jotai';
import { visitHistoryAtom, userDataAtom } from '@/app/lib/store';
import { TaskHistory } from '@/app/components/TaskHistory';
import { Visit } from '@/app/lib/types';
import { UserData } from '@/app/lib/types';
import { useAtom } from 'jotai';

// デモ用の初期データ
const demoVisits: Visit[] = [
  {
    id: 'visit-1',
    destinationId: 'dest-1',
    visitedAt: new Date(2025, 10, 20, 10, 30).toISOString(),
    latitude: 35.6851,
    longitude: 139.7101,
    note: '朝のジョギング',
  },
  {
    id: 'visit-2',
    destinationId: 'dest-1',
    visitedAt: new Date(2025, 10, 19, 14, 15).toISOString(),
    latitude: 35.6851,
    longitude: 139.7101,
    note: '散歩',
  },
  {
    id: 'visit-3',
    destinationId: 'dest-2',
    visitedAt: new Date(2025, 10, 18, 9, 0).toISOString(),
    latitude: 35.6762,
    longitude: 139.7674,
    note: '朝活',
  },
  {
    id: 'visit-4',
    destinationId: 'dest-1',
    visitedAt: new Date(2025, 10, 17, 18, 45).toISOString(),
    latitude: 35.6851,
    longitude: 139.7101,
  },
  {
    id: 'visit-5',
    destinationId: 'dest-2',
    visitedAt: new Date(2025, 10, 16, 11, 20).toISOString(),
    latitude: 35.6762,
    longitude: 139.7674,
    note: '友人と一緒',
  },
  {
    id: 'visit-6',
    destinationId: 'dest-1',
    visitedAt: new Date(2025, 10, 15, 16, 0).toISOString(),
    latitude: 35.6851,
    longitude: 139.7101,
  },
];

const demoUserData: UserData = {
  nickname: 'Taro Yamada',
  destinations: [
    {
      id: 'dest-1',
      name: '新宿御苑',
      address: '東京都新宿区内藤町11',
      placeId: 'place-001',
      latitude: 35.6851,
      longitude: 139.7101,
      frequency: {
        days: [0, 3, 5], // 日、水、金（週3回）
        time: '10:00',
      },
      createdAt: new Date(2025, 10, 1).toISOString(),
    },
    {
      id: 'dest-2',
      name: '代々木公園',
      address: '東京都渋谷区代々木',
      latitude: 35.6762,
      longitude: 139.7674,
      frequency: {
        days: [1, 4], // 月、木（週2回）
        time: '09:00',
      },
      createdAt: new Date(2025, 10, 5).toISOString(),
    },
  ],
};

function TaskHistoryDemoContent() {
  const [, setVisits] = useAtom(visitHistoryAtom);
  const [, setUserData] = useAtom(userDataAtom);

  useEffect(() => {
    setVisits(demoVisits);
    setUserData(demoUserData);
  }, [setVisits, setUserData]);

  return (
    <div className="w-screen min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="w-full px-2 sm:px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <TaskHistory />
        </div>
      </div>
    </div>
  );
}

export default function TaskHistoryDemo() {
  return (
    <Provider>
      <TaskHistoryDemoContent />
    </Provider>
  );
}
