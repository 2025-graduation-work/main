import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export type LocationPoint = {
  latitude: number
  longitude: number
  timestamp: number
  accuracy?: number
}

// Game State (Persisted)
export const currencyAtom = atomWithStorage<number>('koko_money', 0)
export const totalDistanceAtom = atomWithStorage<number>('koko_distance', 0) // in meters
export const levelAtom = atomWithStorage<number>('koko_level', 1)

// Session State (Volatile)
export const currentLocationAtom = atom<LocationPoint | null>(null)
export const isTrackingAtom = atom<boolean>(false)
export const sessionDistanceAtom = atom<number>(0)
export const gpsErrorAtom = atom<string | null>(null)

// Game Logic Constants
export const EXCHANGE_RATE = 1.0 // 1 meter = 1 Nata de Coco
export const LEVEL_thresholds = [0, 100, 500, 1000, 2500, 5000, 10000] // Distance required for levels
