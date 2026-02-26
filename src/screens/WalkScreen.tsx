import { BreathingCircle } from '../components/BreathingCircle'
import { Timer } from '../components/Timer'
import { useTimer } from '../hooks/useTimer'

interface Props {
  duration: number
  onDone: (completed: boolean, elapsed: number) => void
  onBack: () => void
}

export function WalkScreen({ duration, onDone, onBack }: Props) {
  const { remaining, elapsed, stop } = useTimer(duration, () =>
    onDone(true, duration)
  )

  const handleStop = () => {
    stop()
    onDone(false, elapsed)
  }

  return (
    <div className="screen">
      <BreathingCircle />
      <h1>Прогулка</h1>
      <Timer remaining={remaining} />
      <p>Отойди. Ты вернёшься.</p>

      <div className="btn-row">
        <div className="btn-row-h">
          <button className="btn btn-ghost" onClick={handleStop}>
            Стоп
          </button>
          <button className="btn btn-ghost" onClick={onBack}>
            ← Назад
          </button>
        </div>
      </div>
    </div>
  )
}
