import { useState } from 'react'
import { Timer } from '../components/Timer'
import { useTimer } from '../hooks/useTimer'
import type { StretchSet } from '../types'

interface Props {
  set: StretchSet
  onDone: (completed: boolean, elapsed: number) => void
  onBack: () => void
}

export function StretchScreen({ set, onDone, onBack }: Props) {
  const [moveIndex, setMoveIndex] = useState(0)
  const [totalElapsed, setTotalElapsed] = useState(0)

  const currentMove = set.moves[moveIndex]
  const isLast = moveIndex === set.moves.length - 1

  const handleMoveComplete = () => {
    setTotalElapsed((e) => e + currentMove.seconds)
    if (isLast) {
      onDone(true, totalElapsed + currentMove.seconds)
    } else {
      setMoveIndex((i) => i + 1)
    }
  }

  const { remaining, elapsed, stop } = useTimer(
    currentMove.seconds,
    handleMoveComplete,
    moveIndex  // resetKey — resets timer when move changes
  )

  const handleNext = () => {
    stop()
    const actualForMove = elapsed
    setTotalElapsed((e) => e + actualForMove)
    if (isLast) {
      onDone(true, totalElapsed + actualForMove)
    } else {
      setMoveIndex((i) => i + 1)
    }
  }

  const handleStop = () => {
    stop()
    onDone(false, totalElapsed + elapsed)
  }

  const progress = ((moveIndex) / set.moves.length) * 100

  return (
    <div className="screen">
      <div style={{ width: '100%' }}>
        <div className="move-sub" style={{ marginBottom: 4 }}>
          {set.name} · {moveIndex + 1} / {set.moves.length}
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="move-label">{currentMove.text}</div>
      <Timer remaining={remaining} small />

      <div className="btn-row">
        <div className="btn-row-h">
          <button className="btn" onClick={handleNext}>
            {isLast ? 'Готово ✓' : 'Далее →'}
          </button>
          <button className="btn btn-ghost" onClick={handleStop}>
            Стоп
          </button>
        </div>
        <button className="btn btn-ghost" onClick={onBack}>
          ← Назад к выбору
        </button>
      </div>
    </div>
  )
}
