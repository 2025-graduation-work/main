'use client'

import { useAtomValue } from 'jotai'
import { currencyAtom, totalDistanceAtom, levelAtom, isTrackingAtom, gpsErrorAtom } from '@/lib/store/game'
import { Footprints, Coins, Trophy, AlertTriangle } from 'lucide-react'

export function GameHUD() {
  const currency = useAtomValue(currencyAtom)
  const totalDistance = useAtomValue(totalDistanceAtom)
  const level = useAtomValue(levelAtom)
  const isTracking = useAtomValue(isTrackingAtom)
  const gpsError = useAtomValue(gpsErrorAtom)

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
      {gpsError && (
        <div className="bg-red-500/90 text-white p-3 rounded-lg shadow-lg flex items-center gap-2 max-w-xs animate-pulse">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-bold">{gpsError}</span>
        </div>
      )}
      
      <div className="bg-white/90 dark:bg-black/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 w-64">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
                <div className="bg-yellow-100 p-1.5 rounded-full">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                    <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Level</div>
                    <div className="text-sm font-bold leading-none">{level}</div>
                </div>
            </div>
            <div className={`h-2 w-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
        </div>

        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Coins className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-medium">Nata</span>
                </div>
                <span className="text-lg font-mono font-bold text-orange-600">{Math.floor(currency).toLocaleString()}</span>
            </div>

            <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                        <Footprints className="h-3 w-3" />
                        <span>Distance</span>
                    </div>
                    <span className="font-mono">{(totalDistance / 1000).toFixed(2)} km</span>
                </div>
                {/* Progress bar to next level placeholder */}
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${(totalDistance % 1000) / 10}%` }} 
                    />
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
