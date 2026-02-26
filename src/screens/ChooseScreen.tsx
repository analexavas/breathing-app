import { TOUCH_VARIANTS } from '../types'
import type { StretchSet } from '../types'

interface Props {
  offerTouch: boolean
  onStretch: () => void
  onWalk: () => void
  onTouch: () => void
  onExit: () => void
  touchDuration: number
  stretchDuration: number
  walkDuration: number
}

function fmt(sec: number) {
  return `${Math.round(sec / 60)} мин`
}

function randomVariant(): string {
  return TOUCH_VARIANTS[Math.floor(Math.random() * TOUCH_VARIANTS.length)]
}

export async function pickRandomStretchSet(): Promise<StretchSet | null> {
  const sets = await window.api.getStretchSets()
  const enabled = sets.filter((s) => s.enabled)
  if (enabled.length === 0) return null
  return enabled[Math.floor(Math.random() * enabled.length)]
}

export function ChooseScreen({
  offerTouch,
  onStretch,
  onWalk,
  onTouch,
  onExit,
  touchDuration,
  stretchDuration,
  walkDuration
}: Props) {
  const handleTouch = () => {
    onTouch()
  }

  return (
    <div className="screen">
      <h1>Что дальше?</h1>

      {offerTouch && (
        <div className="offer-banner">Растяжка завершена — готов прикоснуться к задаче?</div>
      )}

      <div className="btn-row">
        <button className="btn btn-primary" onClick={handleTouch}>
          Коснуться задачи · {fmt(touchDuration)}
        </button>
        <button className="btn" onClick={onStretch}>
          Растяжка · {fmt(stretchDuration)}
        </button>
        <button className="btn" onClick={onWalk}>
          Прогулка · {fmt(walkDuration)}
        </button>
        <button className="btn btn-ghost" onClick={onExit}>
          Выйти
        </button>
      </div>
    </div>
  )
}

export { randomVariant }
