'use client'

import { useEffect, useRef } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { 
  currentLocationAtom, 
  totalDistanceAtom, 
  sessionDistanceAtom, 
  currencyAtom, 
  isTrackingAtom,
  gpsErrorAtom,
  levelAtom,
  LEVEL_thresholds,
  LocationPoint,
  EXCHANGE_RATE
} from '@/lib/store/game'
import { toast } from 'sonner'

// Helper: Haversine Formula for distance in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3 // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c
}

export function WalkTracker() {
  const [isTracking, setIsTracking] = useAtom(isTrackingAtom)
  const setLocation = useSetAtom(currentLocationAtom)
  const setTotalDistance = useSetAtom(totalDistanceAtom)
  const setSessionDistance = useSetAtom(sessionDistanceAtom)
  const setCurrency = useSetAtom(currencyAtom)
  const setLevel = useSetAtom(levelAtom)
  const setGpsError = useSetAtom(gpsErrorAtom)

  // Ref to hold the *previous* valid position to calculate delta
  // We use a ref so we don't trigger re-runs of useEffect on every location update if we don't strictly need to
  const lastPosRef = useRef<LocationPoint | null>(null)

  // Common logic for processing distance updates
  const processDistance = (dist: number) => {
     const earned = dist * EXCHANGE_RATE
     
     setTotalDistance(prev => {
        const newDist = prev + dist
        
        // Check Level Up
        // Find the highest level where threshold <= newDist
        let newLevel = 1
        for (let i = 0; i < LEVEL_thresholds.length; i++) {
            if (newDist >= LEVEL_thresholds[i]) {
                 newLevel = i + 1
            }
        }
        setLevel((currentLevel: number) => {
            if (newLevel > currentLevel) {
                toast.success(`Level Up! You are now level ${newLevel}!`)
                return newLevel
            }
            return currentLevel
        })

        return newDist
     })
     setSessionDistance(prev => prev + dist)
     setCurrency(prev => prev + earned)
  }

  // Debug: Listen for 'D' key to simulate walking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        // Build simulation: add 5 meters
        processDistance(5)
        toast.success('Debug: +5 meters walked')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setTotalDistance, setSessionDistance, setCurrency, setLevel]) // processDistance dependencies expanded here to avoid stale closures if we used useCallback without deps, but here we just depend on setters which are stable.

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGpsError('Geolocation is not supported by this browser.')
      return
    }

    let watchId: number

    const startTracking = () => {
      setIsTracking(true)
      
      const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords
          const timestamp = position.timestamp

          // Basic noise filter: ignore low accuracy (> 50m might be too jittery for detailed walking, but okay for MVP)
          if (accuracy > 100) {
            // console.warn('Skipping low accuracy point', accuracy)
            return
          }

          const newPoint: LocationPoint = { latitude, longitude, timestamp, accuracy }
          
          setLocation(newPoint)
          setGpsError(null)

          if (lastPosRef.current) {
            const dist = getDistance(
              lastPosRef.current.latitude,
              lastPosRef.current.longitude,
              latitude,
              longitude
            )

            // Speed filter: walking speed is roughly < 2m/s (7.2km/h). 
            // Running < 6m/s (21km/h). 
            // If delta distance / delta time implies impossibly high speed, ignore it (teleport/GPS jump).
            const timeDelta = (timestamp - lastPosRef.current.timestamp) / 1000 // seconds
            
            // Allow up to 25m/s (90km/h) just to be safe for cars, but for WALKING game we might want strict content.
            // Let's stick to a sanity check to avoid massive jumps (100m/s).
            if (dist > 0 && (dist / (timeDelta || 1)) < 100) {
              // Valid movement
              
              // Only count if meaningful movement (> 2 meters) to avoid jitter accumulation while standing still
              if (dist > 2) {
                 processDistance(dist)
                 lastPosRef.current = newPoint
              }
            } else {
               // Jumped too far too fast - ignore but update ref if it stabilizes? 
               // For now, if it's a huge jump, assume valid new start point if sustained? 
               // Simplest: just update ref so we don't get stuck, but don't count distance.
               lastPosRef.current = newPoint
            }
          } else {
            // First point
            lastPosRef.current = newPoint
          }
        },
        (error) => {
          console.error('GPS Error', error)
          let msg = 'Unknown GPS error'
          switch(error.code) {
             case error.PERMISSION_DENIED: msg = '位置情報の利用が許可されていません'; break;
             case error.POSITION_UNAVAILABLE: msg = '位置情報が取得できません'; break;
             case error.TIMEOUT: msg = '位置情報の取得がタイムアウトしました'; break;
          }
          setGpsError(msg)
          // Optional: toast.error(msg)
        },
        options
      )
    }

    startTracking()

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId)
      setIsTracking(false)
    }
  }, [setIsTracking, setLocation, setTotalDistance, setSessionDistance, setCurrency, setGpsError, setLevel]) // Dependencies updated

  return null // Headless component
}
