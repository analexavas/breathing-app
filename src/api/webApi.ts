/**
 * Web storage adapter — mirrors window.api (Electron IPC) using localStorage.
 * Injected as window.api in main.tsx before React mounts.
 */
import type { Settings, StretchSet, SessionStep, Analytics, DayStats } from '../types'
import { DEFAULT_SETTINGS } from '../types'

// ── Storage keys ─────────────────────────────────────────────────────────────

const K = {
  settings: 'fi:settings',
  sets:     'fi:sets',
  sessions: 'fi:sessions',
  steps:    'fi:steps',
} as const

// ── Helpers ───────────────────────────────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, val: unknown): void {
  localStorage.setItem(key, JSON.stringify(val))
}

// ── Seed on first run ─────────────────────────────────────────────────────────

function seedDefaults(): void {
  if (!localStorage.getItem(K.settings)) {
    save(K.settings, DEFAULT_SETTINGS)
  }
  if (!localStorage.getItem(K.sets)) {
    const sets: StretchSet[] = [
      {
        id: 'upper_body_01',
        name: 'Сброс верхней части тела',
        enabled: true,
        moves: [
          { text: 'Плечи вверх-вниз',         seconds: 30 },
          { text: 'Медленный поворот шеи',     seconds: 30 },
          { text: 'Руки вверх — потянуться',   seconds: 60 },
          { text: 'Наклон вперёд',              seconds: 60 },
        ]
      },
      {
        id: 'desk_reset_02',
        name: 'Разминка за столом',
        enabled: true,
        moves: [
          { text: 'Круги запястьями (обе руки)',         seconds: 20 },
          { text: 'Раскрытие груди — руки за спиной',   seconds: 30 },
          { text: 'Скрутка позвоночника сидя (Л)',       seconds: 20 },
          { text: 'Скрутка позвоночника сидя (П)',       seconds: 20 },
        ]
      }
    ]
    save(K.sets, sets)
  }
}

// ── Session types ─────────────────────────────────────────────────────────────

interface StoredSession {
  id: string
  ts_start: string
  ts_end?: string
  smoked?: boolean
}

interface StoredStep extends SessionStep {
  id: string
  session_id: string
}

function getSessions(): StoredSession[] { return load<StoredSession[]>(K.sessions, []) }
function getSteps():    StoredStep[]    { return load<StoredStep[]>(K.steps, []) }

// ── Settings ──────────────────────────────────────────────────────────────────

function getSettings(): Promise<Settings> {
  return Promise.resolve(load<Settings>(K.settings, DEFAULT_SETTINGS))
}

function updateSettings(updates: Partial<Settings>): Promise<void> {
  const current = load<Settings>(K.settings, DEFAULT_SETTINGS)
  save(K.settings, { ...current, ...updates })
  return Promise.resolve()
}

// ── Stretch sets ──────────────────────────────────────────────────────────────

function getStretchSets(): Promise<StretchSet[]> {
  return Promise.resolve(load<StretchSet[]>(K.sets, []))
}

function createStretchSet(set: StretchSet): Promise<StretchSet> {
  const sets = load<StretchSet[]>(K.sets, [])
  const created = { ...set, id: set.id || crypto.randomUUID() }
  save(K.sets, [...sets, created])
  return Promise.resolve(created)
}

function updateStretchSet(set: StretchSet): Promise<void> {
  const sets = load<StretchSet[]>(K.sets, [])
  save(K.sets, sets.map((s) => (s.id === set.id ? set : s)))
  return Promise.resolve()
}

function deleteStretchSet(id: string): Promise<void> {
  const sets = load<StretchSet[]>(K.sets, [])
  save(K.sets, sets.filter((s) => s.id !== id))
  return Promise.resolve()
}

// ── Sessions ──────────────────────────────────────────────────────────────────

function startSession(): Promise<string> {
  const id = crypto.randomUUID()
  const sessions = getSessions()
  sessions.push({ id, ts_start: new Date().toISOString() })

  // Prune sessions older than 30 days to keep localStorage lean
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const pruned = sessions.filter((s) => new Date(s.ts_start) > cutoff)
  save(K.sessions, pruned)

  // Also prune orphaned steps
  const validIds = new Set(pruned.map((s) => s.id))
  const steps = getSteps().filter((s) => validIds.has(s.session_id))
  save(K.steps, steps)

  return Promise.resolve(id)
}

function logStep(sessionId: string, step: SessionStep): Promise<void> {
  const steps = getSteps()
  steps.push({ ...step, id: crypto.randomUUID(), session_id: sessionId })
  save(K.steps, steps)
  return Promise.resolve()
}

function endSession(sessionId: string, smoked?: boolean): Promise<void> {
  const sessions = getSessions().map((s) =>
    s.id === sessionId
      ? { ...s, ts_end: new Date().toISOString(), smoked: smoked ?? undefined }
      : s
  )
  save(K.sessions, sessions)
  return Promise.resolve()
}

// ── Analytics ─────────────────────────────────────────────────────────────────

function getAnalytics(): Promise<Analytics> {
  const sessions = getSessions()
  const steps    = getSteps()
  const todayStr = new Date().toISOString().slice(0, 10)

  const todaySessions = sessions.filter((s) => s.ts_start.startsWith(todayStr))
  const todayIds      = new Set(todaySessions.map((s) => s.id))
  const todaySteps    = steps.filter((s) => todayIds.has(s.session_id))

  const today = {
    sessions_total:  todaySessions.length,
    pause_completed: todaySteps.filter((s) => s.type === 'pause'   && s.completed).length,
    stretch_used:    new Set(todaySteps.filter((s) => s.type === 'stretch').map((s) => s.session_id)).size,
    walking_used:    new Set(todaySteps.filter((s) => s.type === 'walk').map((s)    => s.session_id)).size,
    touch_completed: todaySteps.filter((s) => s.type === 'touch'   && s.completed).length,
    smoked_logged:   todaySessions.filter((s) => s.smoked === true).length,
  }

  const week: DayStats[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr    = d.toISOString().slice(0, 10)
    const daySess    = sessions.filter((s) => s.ts_start.startsWith(dateStr))
    const dayIds     = new Set(daySess.map((s) => s.id))
    const daySteps   = steps.filter((s) => dayIds.has(s.session_id))
    week.push({
      date:            dateStr,
      sessions:        daySess.length,
      touch_completed: daySteps.filter((s) => s.type === 'touch' && s.completed).length,
    })
  }

  return Promise.resolve({ today, week })
}

// ── No-ops for desktop-only features ─────────────────────────────────────────

function hideWindow():          Promise<void> { return Promise.resolve() }
function updateHotkey(_k: string): Promise<void> { return Promise.resolve() }
function onHotkeyTriggered(_cb: () => void): () => void { return () => {} }

// ── Exported API object ───────────────────────────────────────────────────────

export const webApi = {
  getSettings,
  updateSettings,
  getStretchSets,
  createStretchSet,
  updateStretchSet,
  deleteStretchSet,
  startSession,
  logStep,
  endSession,
  getAnalytics,
  hideWindow,
  updateHotkey,
  onHotkeyTriggered,
}

seedDefaults()
