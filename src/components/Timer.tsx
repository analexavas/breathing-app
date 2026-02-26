interface TimerProps {
  remaining: number
  small?: boolean
}

export function Timer({ remaining, small }: TimerProps) {
  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  const display = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return <div className={small ? 'timer-sm' : 'timer'}>{display}</div>
}
