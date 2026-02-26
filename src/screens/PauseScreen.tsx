import { useEffect } from 'react'
import { BreathingCircle } from '../components/BreathingCircle'
import { Timer } from '../components/Timer'
import { useTimer } from '../hooks/useTimer'

interface Props {
  duration: number
  sessionId: string | null
  onDone: (completed: boolean, elapsed: number) => void
  onOpenSettings: () => void
}

export function PauseScreen({ duration, sessionId, onDone, onOpenSettings }: Props) {
  const { remaining, elapsed, stop } = useTimer(duration, () => onDone(true, duration))

  // Log start to console (no-op if no sessionId yet)
  useEffect(() => {
    if (sessionId) {
      console.debug('[pause] session', sessionId)
    }
  }, [sessionId])

  const handleEndEarly = () => {
    stop()
    onDone(false, elapsed)
  }

  return (
    <div className="screen">
      <BreathingCircle />
      <h1>Пауза</h1>
      <Timer remaining={remaining} />
      <div className="btn-row">
        <button className="btn btn-ghost" onClick={handleEndEarly}>
          Завершить паузу
        </button>
        <button className="btn btn-ghost" onClick={onOpenSettings} style={{ fontSize: 12 }}>
          ⚙ Настройки
        </button>
      </div>
    </div>
  )
}
