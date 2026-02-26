export interface Settings {
  theme: 'warm' | 'minimal' | 'analytical'
  hotkey: string
  pause_sec: number
  touch_sec: number
  walk_sec: number
  stretch_sec: number
  accent_hue: number   // 0–360, drives the full palette via algorithm
}

export interface StretchMove {
  text: string
  seconds: number
}

export interface StretchSet {
  id: string
  name: string
  enabled: boolean
  moves: StretchMove[]
}

export interface SessionStep {
  type: 'pause' | 'stretch' | 'walk' | 'touch'
  set_id?: string
  variant?: string
  planned_sec: number
  actual_sec: number
  completed: boolean
}

export interface DayStats {
  date: string
  sessions: number
  touch_completed: number
}

export interface Analytics {
  today: {
    sessions_total: number
    pause_completed: number
    stretch_used: number
    walking_used: number
    touch_completed: number
    smoked_logged: number
  }
  week: DayStats[]
}

export const TOUCH_VARIANTS = [
  'Написать однострочный комментарий',
  'Открыть файл и добавить TODO',
  'Переименовать одну переменную'
] as const

export const DEFAULT_SETTINGS: Settings = {
  theme: 'warm',
  hotkey: 'Ctrl+Shift+Space',
  pause_sec: 180,
  touch_sec: 180,
  walk_sec: 300,
  stretch_sec: 180,
  accent_hue: 28
}
