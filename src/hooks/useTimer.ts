import { useState, useEffect, useRef, useCallback } from 'react'

export interface TimerHandle {
  remaining: number
  running: boolean
  elapsed: number
  stop: () => void
}

/**
 * Timestamp-based countdown — immune to background throttling.
 *
 * Instead of decrementing a counter every second, we record the wall-clock
 * start time and recompute `remaining = duration - (now - startedAt)` on
 * every tick. If the app is backgrounded/screen locked and the tick fires
 * late, the displayed time jumps to wherever it actually is.
 *
 * Works correctly on desktop (Electron) and mobile (React Native / PWA).
 */
export function useTimer(
  initialSeconds: number,
  onComplete: () => void,
  resetKey?: number | string
): TimerHandle {
  const startedAtRef  = useRef<number>(Date.now())
  const pausedAtRef   = useRef<number | null>(null)
  const [remaining, setRemaining] = useState(initialSeconds)
  const [running,   setRunning]   = useState(true)

  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // Re-initialise on resetKey / duration change
  useEffect(() => {
    startedAtRef.current = Date.now()
    pausedAtRef.current  = null
    setRemaining(initialSeconds)
    setRunning(true)
  }, [initialSeconds, resetKey])

  // Tick loop — uses wall clock, not tick count
  useEffect(() => {
    if (!running || remaining <= 0) return

    const id = setInterval(() => {
      const elapsed  = Math.floor((Date.now() - startedAtRef.current) / 1000)
      const left     = Math.max(initialSeconds - elapsed, 0)
      setRemaining(left)
      if (left <= 0) {
        clearInterval(id)
        onCompleteRef.current()
      }
    }, 500)   // poll every 500ms so display stays accurate even after late wakeup

    return () => clearInterval(id)
  }, [running, initialSeconds, resetKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const stop = useCallback(() => {
    pausedAtRef.current = Date.now()
    setRunning(false)
  }, [])

  return {
    remaining,
    running,
    elapsed: initialSeconds - remaining,
    stop
  }
}
