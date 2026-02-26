import { useState } from 'react'
import { Timer } from '../components/Timer'
import { useTimer } from '../hooks/useTimer'

interface Props {
  variant: string
  duration: number
  onDone: (completed: boolean, elapsed: number) => void
}

export function TouchScreen({ variant, duration, onDone }: Props) {
  const [logged, setLogged] = useState(false)

  const { remaining, elapsed, stop } = useTimer(duration, () => {
    setLogged(true)
    setTimeout(() => onDone(true, duration), 1200)
  })

  const handleDone = () => {
    stop()
    setLogged(true)
    setTimeout(() => onDone(true, elapsed), 1000)
  }

  const handleStop = () => {
    stop()
    onDone(false, elapsed)
  }

  if (logged) {
    return (
      <div className="screen">
        <div style={{ fontSize: 40 }}>✓</div>
        <h2>Записано</h2>
      </div>
    )
  }

  return (
    <div className="screen">
      <h1>Коснись задачи</h1>
      <div
        style={{
          background: 'var(--bg3)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '14px 16px',
          fontSize: 15,
          color: 'var(--text)',
          textAlign: 'center',
          lineHeight: 1.5,
          width: '100%'
        }}
      >
        {variant}
      </div>
      <Timer remaining={remaining} />

      <div className="btn-row">
        <div className="btn-row-h">
          <button className="btn btn-primary" onClick={handleDone}>
            Готово ✓
          </button>
          <button className="btn btn-ghost" onClick={handleStop}>
            Стоп
          </button>
        </div>
      </div>
    </div>
  )
}
