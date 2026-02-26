import { useReducer, useState, useEffect, useCallback, useRef } from 'react'
import { machineReducer, initialState } from './state/machine'
import { PauseScreen } from './screens/PauseScreen'
import { ChooseScreen, pickRandomStretchSet, randomVariant } from './screens/ChooseScreen'
import { StretchScreen } from './screens/StretchScreen'
import { WalkScreen } from './screens/WalkScreen'
import { TouchScreen } from './screens/TouchScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { AnalyticsScreen } from './screens/AnalyticsScreen'
import type { Settings, SessionStep } from './types'
import { DEFAULT_SETTINGS } from './types'
import { applyAccentHue } from './utils/palette'

// ── Wake lock — keeps the screen on while a timer is running ──────────────────

function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!('wakeLock' in navigator)) return

    if (active) {
      navigator.wakeLock.request('screen').then((sentinel) => {
        lockRef.current = sentinel
      }).catch(() => {/* user denied or not supported */})
    } else {
      lockRef.current?.release().catch(() => {})
      lockRef.current = null
    }

    return () => {
      lockRef.current?.release().catch(() => {})
      lockRef.current = null
    }
  }, [active])
}

// ── Top bar ───────────────────────────────────────────────────────────────────

function TopBar({
  title,
  onSettings,
  onAnalytics,
  showSettings = true
}: {
  title: string
  onSettings?: () => void
  onAnalytics?: () => void
  showSettings?: boolean
}) {
  return (
    <div className="top-bar">
      <span className="top-bar-title">{title}</span>
      <div className="top-bar-actions">
        {onAnalytics && (
          <button className="icon-btn" onClick={onAnalytics} title="Аналитика">
            ◎
          </button>
        )}
        {showSettings && onSettings && (
          <button className="icon-btn" onClick={onSettings} title="Настройки">
            ⚙
          </button>
        )}
      </div>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [state, dispatch] = useReducer(machineReducer, initialState)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)

  // Timer screens that need the screen to stay on
  const timerActive = ['PAUSE', 'STRETCH', 'WALK', 'TOUCH'].includes(state.screen)
  useWakeLock(timerActive)

  // ── Bootstrap ───────────────────────────────────────────────────────────────

  useEffect(() => {
    window.api.getSettings().then((s) => {
      setSettings(s)
      document.documentElement.setAttribute('data-theme', s.theme)
      applyAccentHue(s.accent_hue ?? 28)
    })
  }, [])

  // Re-apply palette whenever settings change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme)
    applyAccentHue(settings.accent_hue ?? 28)
  }, [settings.theme, settings.accent_hue])

  // ── Start session when entering PAUSE ──────────────────────────────────────

  useEffect(() => {
    if (state.screen === 'PAUSE' && !state.sessionId) {
      window.api.startSession().then((id) => dispatch({ type: 'SESSION_STARTED', sessionId: id }))
    }
  }, [state.screen, state.sessionId])

  // ── Session logging helpers ────────────────────────────────────────────────

  const logStep = useCallback(
    (step: SessionStep) => {
      if (state.sessionId) window.api.logStep(state.sessionId, step)
    },
    [state.sessionId]
  )

  const endSession = useCallback(
    (smoked?: boolean) => {
      if (state.sessionId) window.api.endSession(state.sessionId, smoked)
    },
    [state.sessionId]
  )

  // ── Screen handlers ────────────────────────────────────────────────────────

  const handlePauseDone = (completed: boolean, elapsed: number) => {
    logStep({ type: 'pause', planned_sec: settings.pause_sec, actual_sec: elapsed, completed })
    dispatch({ type: 'PAUSE_DONE', completed })
  }

  const handleChooseStretch = async () => {
    const set = await pickRandomStretchSet()
    if (!set) return
    dispatch({ type: 'CHOOSE_STRETCH', set })
  }

  const handleChooseWalk  = () => dispatch({ type: 'CHOOSE_WALK' })

  const handleChooseTouch = () => {
    const v = randomVariant()
    dispatch({ type: 'CHOOSE_TOUCH', variant: v })
  }

  const handleStretchDone = (completed: boolean, elapsed: number) => {
    logStep({ type: 'stretch', set_id: state.stretchSet?.id, planned_sec: settings.stretch_sec, actual_sec: elapsed, completed })
    dispatch({ type: 'STRETCH_DONE', completed })
  }

  const handleWalkDone = (completed: boolean, elapsed: number) => {
    logStep({ type: 'walk', planned_sec: settings.walk_sec, actual_sec: elapsed, completed })
    dispatch({ type: 'WALK_DONE', completed })
  }

  const handleTouchDone = (completed: boolean, elapsed: number) => {
    logStep({ type: 'touch', variant: state.touchVariant ?? undefined, planned_sec: settings.touch_sec, actual_sec: elapsed, completed })
    endSession()
    dispatch({ type: 'TOUCH_DONE' })
  }

  const handleExit = () => {
    endSession()
    dispatch({ type: 'EXIT' })
  }

  const handleSaveSettings = async (s: Settings) => {
    setSettings(s)
    await window.api.updateSettings(s)
    dispatch({ type: 'CLOSE_SETTINGS' })
  }

  // ── Navigation helpers ─────────────────────────────────────────────────────

  const openSettings  = () => dispatch({ type: 'OPEN_SETTINGS' })
  const openAnalytics = () => dispatch({ type: 'OPEN_ANALYTICS' })

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="app">
      {state.screen === 'PAUSE' && (
        <>
          <TopBar title="Пауза" onSettings={openSettings} />
          <PauseScreen
            duration={settings.pause_sec}
            sessionId={state.sessionId}
            onDone={handlePauseDone}
            onOpenSettings={openSettings}
          />
        </>
      )}

      {state.screen === 'CHOOSE' && (
        <>
          <TopBar title="Что дальше?" onSettings={openSettings} onAnalytics={openAnalytics} />
          <ChooseScreen
            offerTouch={state.offerTouch}
            onStretch={handleChooseStretch}
            onWalk={handleChooseWalk}
            onTouch={handleChooseTouch}
            onExit={handleExit}
            touchDuration={settings.touch_sec}
            stretchDuration={settings.stretch_sec}
            walkDuration={settings.walk_sec}
          />
        </>
      )}

      {state.screen === 'STRETCH' && state.stretchSet && (
        <>
          <TopBar title="Растяжка" showSettings={false} />
          <StretchScreen
            set={state.stretchSet}
            onDone={handleStretchDone}
            onBack={() => dispatch({ type: 'STRETCH_DONE', completed: false })}
          />
        </>
      )}

      {state.screen === 'WALK' && (
        <>
          <TopBar title="Прогулка" showSettings={false} />
          <WalkScreen
            duration={settings.walk_sec}
            onDone={handleWalkDone}
            onBack={() => dispatch({ type: 'WALK_DONE', completed: false })}
          />
        </>
      )}

      {state.screen === 'TOUCH' && state.touchVariant && (
        <>
          <TopBar title="Коснись задачи" showSettings={false} />
          <TouchScreen
            variant={state.touchVariant}
            duration={settings.touch_sec}
            onDone={handleTouchDone}
          />
        </>
      )}

      {state.screen === 'SETTINGS' && (
        <>
          <TopBar title="Настройки" showSettings={false} onAnalytics={openAnalytics} />
          <SettingsScreen
            settings={settings}
            onSave={handleSaveSettings}
            onClose={() => {
              applyAccentHue(settings.accent_hue ?? 28)
              dispatch({ type: 'CLOSE_SETTINGS' })
            }}
          />
        </>
      )}

      {state.screen === 'ANALYTICS' && (
        <>
          <TopBar title="Аналитика" showSettings={false} />
          <AnalyticsScreen onClose={() => dispatch({ type: 'CLOSE_ANALYTICS' })} />
        </>
      )}

      {state.screen === 'IDLE' && (
        <div className="screen idle-screen">
          <div className="idle-icon">◎</div>
          <h1 style={{ textAlign: 'center', lineHeight: 1.2 }}>Friction</h1>
          <p style={{ textAlign: 'center', marginBottom: 8 }}>
            Нажми кнопку, когда чувствуешь прокрастинацию
          </p>
          <button
            className="btn btn-primary idle-start-btn"
            onClick={() => dispatch({ type: 'HOTKEY_PRESSED' })}
          >
            Начать паузу
          </button>
          <button
            className="btn btn-ghost"
            onClick={openSettings}
            style={{ marginTop: 4 }}
          >
            ⚙ Настройки
          </button>
        </div>
      )}
    </div>
  )
}
