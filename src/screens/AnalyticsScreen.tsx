import { useEffect, useState } from 'react'
import type { Analytics } from '../types'

interface Props {
  onClose: () => void
}

export function AnalyticsScreen({ onClose }: Props) {
  const [data, setData] = useState<Analytics | null>(null)

  useEffect(() => {
    window.api.getAnalytics().then(setData)
  }, [])

  if (!data) {
    return (
      <div className="screen">
        <p>Загрузка…</p>
      </div>
    )
  }

  const today = new Date().toISOString().slice(0, 10)

  const todayStats: { label: string; value: number }[] = [
    { label: 'Сессий', value: data.today.sessions_total },
    { label: 'Пауза завершена', value: data.today.pause_completed },
    { label: 'Растяжка', value: data.today.stretch_used },
    { label: 'Прогулка', value: data.today.walking_used },
    { label: 'Задача затронута', value: data.today.touch_completed },
    { label: 'Курение', value: data.today.smoked_logged }
  ]

  return (
    <div className="screen" style={{ justifyContent: 'flex-start', paddingTop: 16, overflowY: 'auto' }}>
      <h2 style={{ alignSelf: 'flex-start' }}>Сегодня</h2>

      <div className="stats-grid">
        {todayStats.map(({ label, value }) => (
          <div key={label} className="stat-card">
            <div className="stat-val">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <h2 style={{ alignSelf: 'flex-start', marginTop: 8 }}>За неделю</h2>

      <table className="week-table">
        <thead>
          <tr>
            <th>Дата</th>
            <th>Сессий</th>
            <th>Задача</th>
          </tr>
        </thead>
        <tbody>
          {data.week.map((d) => (
            <tr key={d.date} className={d.date === today ? 'today' : ''}>
              <td>{d.date.slice(5)}</td>
              <td>{d.sessions}</td>
              <td>{d.touch_completed}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="btn btn-ghost" onClick={onClose} style={{ marginTop: 8 }}>
        Закрыть
      </button>
    </div>
  )
}
